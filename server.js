const crypto = require("node:crypto");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "workspace.json");
const exampleDataFile = path.join(dataDir, "workspace.example.json");
const backupDir = path.join(dataDir, "backups");
const uploadDir = path.join(dataDir, "uploads");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const maxBodyBytes = 16 * 1024 * 1024;
const maxAttachmentBytes = 10 * 1024 * 1024;
const maxBackups = Number(process.env.MAX_BACKUPS || 30);
const sessions = new Map();
let writeQueue = Promise.resolve();

const roles = {
  admin: { canCreate: true, canEdit: true, canDelete: true, canMoveAll: true, canManageAccess: true },
  manager: { canCreate: true, canEdit: true, canDelete: false, canMoveAll: true, canManageAccess: false },
  developer: { canCreate: true, canEdit: false, canDelete: false, canMoveAll: false, canManageAccess: false },
  viewer: { canCreate: false, canEdit: false, canDelete: false, canMoveAll: false, canManageAccess: false },
};

const statuses = new Set(["backlog", "todo", "in_progress", "review", "done"]);
const taskFields = [
  "title",
  "description",
  "type",
  "priority",
  "status",
  "sprint",
  "due",
  "points",
  "branch",
  "assigneeIds",
  "labels",
  "color",
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    if (url.pathname.startsWith("/uploads/")) {
      await serveUploadFile(url.pathname, response);
      return;
    }

    await serveStaticFile(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, { error: "Internal server error", detail: error.message });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set another PORT or stop the process that uses it.`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, host, () => {
  console.log(`Planum is running at http://${host}:${port}`);
});

async function handleApi(request, response, url) {
  if (url.pathname === "/api/state") {
    await handleStateApi(request, response);
    return;
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    await handleLogin(request, response);
    return;
  }

  if (url.pathname === "/api/session" && request.method === "GET") {
    const workspace = await readWorkspace();
    const actor = authenticate(request, response, workspace);
    if (!actor) return;
    sendJson(response, 200, { user: sanitizeUser(actor.user) });
    return;
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    const token = getBearerToken(request);
    if (token) sessions.delete(token);
    sendJson(response, 200, { ok: true });
    return;
  }

  const workspace = await readWorkspace();
  const actor = authenticate(request, response, workspace);
  if (!actor) return;

  if (url.pathname === "/api/notifications/read-all" && request.method === "POST") {
    await handleReadAllNotifications(response, workspace, actor.user);
    return;
  }

  const notificationRoute = url.pathname.match(/^\/api\/notifications\/([^/]+)$/);
  if (notificationRoute) {
    await handleNotificationRoute(request, response, workspace, actor.user, decodeURIComponent(notificationRoute[1]));
    return;
  }

  if (url.pathname === "/api/tasks" && request.method === "POST") {
    await handleCreateTask(request, response, workspace, actor.user);
    return;
  }

  const checklistRoute = url.pathname.match(/^\/api\/tasks\/([^/]+)\/checklist(?:\/([^/]+))?$/);
  if (checklistRoute) {
    await handleChecklistRoute(
      request,
      response,
      workspace,
      actor.user,
      decodeURIComponent(checklistRoute[1]),
      checklistRoute[2] ? decodeURIComponent(checklistRoute[2]) : null,
    );
    return;
  }

  const attachmentRoute = url.pathname.match(/^\/api\/tasks\/([^/]+)\/attachments(?:\/([^/]+))?$/);
  if (attachmentRoute) {
    await handleAttachmentRoute(
      request,
      response,
      workspace,
      actor.user,
      decodeURIComponent(attachmentRoute[1]),
      attachmentRoute[2] ? decodeURIComponent(attachmentRoute[2]) : null,
    );
    return;
  }

  const taskRoute = url.pathname.match(/^\/api\/tasks\/([^/]+)(?:\/([^/]+))?$/);
  if (taskRoute) {
    await handleTaskRoute(request, response, workspace, actor.user, decodeURIComponent(taskRoute[1]), taskRoute[2]);
    return;
  }

  if (url.pathname === "/api/users" && request.method === "POST") {
    await handleCreateUser(request, response, workspace, actor.user);
    return;
  }

  const userRoute = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userRoute) {
    await handleUserRoute(request, response, workspace, actor.user, decodeURIComponent(userRoute[1]));
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

async function handleStateApi(request, response) {
  const workspace = await readWorkspace();

  if (request.method === "GET") {
    sendWorkspace(response, workspace);
    return;
  }

  if (request.method === "PUT") {
    const actor = workspace.users.length ? authenticate(request, response, workspace) : null;
    if (workspace.users.length && (!actor || !canManageAccess(actor.user))) return;

    const payload = await readJsonBody(request, response);
    if (!payload) return;

    if (!isValidWorkspace(payload)) {
      sendJson(response, 422, { error: "Workspace must include users and tasks arrays" });
      return;
    }

    const nextWorkspace = normalizeWorkspace(payload, workspace);
    await writeWorkspace(nextWorkspace);
    sendWorkspace(response, nextWorkspace);
    return;
  }

  response.writeHead(405, { Allow: "GET, PUT" });
  response.end();
}

async function handleLogin(request, response) {
  const workspace = await readWorkspace();
  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const user = workspace.users.find((item) => item.id === payload.userId);
  const expectedPin = String(user?.pin || "1111");
  const submittedPin = String(payload.pin || "").trim();

  if (!user || submittedPin !== expectedPin) {
    sendJson(response, 401, { error: "Invalid user or PIN" });
    return;
  }

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, user.id);
  sendJson(response, 200, { token, user: sanitizeUser(user) });
}

async function handleCreateTask(request, response, workspace, actor) {
  if (!roleFor(actor).canCreate) {
    sendJson(response, 403, { error: "Current role cannot create tasks" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const now = new Date().toISOString();
  const task = normalizeTask({
    id: nextTaskId(workspace),
    ...payload,
    reporterId: actor.id,
    createdAt: now,
    updatedAt: now,
    commits: [],
    comments: [],
  });

  if (!task.title) {
    sendJson(response, 422, { error: "Task title is required" });
    return;
  }

  workspace.tasks.unshift(task);
  addActivity(workspace, actor.id, task.id, "создал задачу");
  notifyUsers(
    workspace,
    task.assigneeIds.filter((userId) => userId !== actor.id),
    actor.id,
    task.id,
    `назначил задачу ${task.id}`,
  );
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleTaskRoute(request, response, workspace, actor, taskId, subroute) {
  const task = workspace.tasks.find((item) => item.id === taskId);
  if (!task) {
    sendJson(response, 404, { error: "Task not found" });
    return;
  }

  if (!subroute && request.method === "PATCH") {
    await handleUpdateTask(request, response, workspace, actor, task);
    return;
  }

  if (!subroute && request.method === "DELETE") {
    await handleDeleteTask(response, workspace, actor, task);
    return;
  }

  if (subroute === "status" && request.method === "PATCH") {
    await handleMoveTask(request, response, workspace, actor, task);
    return;
  }

  if (subroute === "commits" && request.method === "POST") {
    await handleCreateCommit(request, response, workspace, actor, task);
    return;
  }

  if (subroute === "comments" && request.method === "POST") {
    await handleCreateComment(request, response, workspace, actor, task);
    return;
  }

  sendJson(response, 405, { error: "Unsupported task operation" });
}

async function handleUpdateTask(request, response, workspace, actor, task) {
  if (!roleFor(actor).canEdit) {
    sendJson(response, 403, { error: "Current role cannot edit this task" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const previousAssignees = new Set(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  for (const field of taskFields) {
    if (field in payload) {
      task[field] = payload[field];
    }
  }

  if (Array.isArray(payload.assigneeIds)) {
    const newAssignees = payload.assigneeIds.filter((userId) => !previousAssignees.has(userId) && userId !== actor.id);
    notifyUsers(workspace, newAssignees, actor.id, task.id, `назначил вас на ${task.id}`);
  }

  Object.assign(task, normalizeTask(task), { updatedAt: new Date().toISOString() });
  addActivity(workspace, actor.id, task.id, "обновил задачу");
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleDeleteTask(response, workspace, actor, task) {
  if (!roleFor(actor).canDelete) {
    sendJson(response, 403, { error: "Current role cannot delete tasks" });
    return;
  }

  workspace.tasks = workspace.tasks.filter((item) => item.id !== task.id);
  addActivity(workspace, actor.id, null, `удалил задачу ${task.id}`);
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleMoveTask(request, response, workspace, actor, task) {
  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const targetStatus = String(payload.status || "");
  if (!statuses.has(targetStatus)) {
    sendJson(response, 422, { error: "Unknown task status" });
    return;
  }

  if (!canMove(actor, task, targetStatus)) {
    sendJson(response, 403, { error: "Current role cannot move this task" });
    return;
  }

  if (task.status !== targetStatus) {
    task.status = targetStatus;
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, `перевел задачу в ${statusLabel(targetStatus)}`);
    await writeWorkspace(workspace);
  }

  sendWorkspace(response, workspace);
}

async function handleCreateCommit(request, response, workspace, actor, task) {
  if (!canAddCommit(actor, task)) {
    sendJson(response, 403, { error: "Current role cannot add commits to this task" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const hash = String(payload.hash || "")
    .trim()
    .replace(/[^a-fA-F0-9]/g, "")
    .slice(0, 12);
  const message = String(payload.message || "").trim();
  const branch = String(payload.branch || task.branch || "").trim();

  if (!hash || !message) {
    sendJson(response, 422, { error: "Commit hash and message are required" });
    return;
  }

  task.commits = Array.isArray(task.commits) ? task.commits : [];
  task.commits.push({
    id: uid("c"),
    hash,
    authorId: actor.id,
    branch,
    message,
    createdAt: new Date().toISOString(),
  });
  task.branch = branch || task.branch;
  task.updatedAt = new Date().toISOString();
  addActivity(workspace, actor.id, task.id, `добавил коммит ${hash}`);
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleCreateComment(request, response, workspace, actor, task) {
  if (actor.role === "viewer") {
    sendJson(response, 403, { error: "Viewers cannot comment" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const text = String(payload.text || "").trim();
  if (!text) {
    sendJson(response, 422, { error: "Comment is empty" });
    return;
  }

  task.comments = Array.isArray(task.comments) ? task.comments : [];
  task.comments.push({
    id: uid("cm"),
    authorId: actor.id,
    text,
    mentions: findMentionedUserIds(workspace, text),
    createdAt: new Date().toISOString(),
  });
  task.updatedAt = new Date().toISOString();
  addActivity(workspace, actor.id, task.id, "оставил комментарий");
  notifyUsers(
    workspace,
    findMentionedUserIds(workspace, text).filter((userId) => userId !== actor.id),
    actor.id,
    task.id,
    `упомянул вас в ${task.id}`,
  );
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleChecklistRoute(request, response, workspace, actor, taskId, itemId) {
  const task = workspace.tasks.find((item) => item.id === taskId);
  if (!task) {
    sendJson(response, 404, { error: "Task not found" });
    return;
  }

  if (!canWorkOnTask(actor, task)) {
    sendJson(response, 403, { error: "Current role cannot update checklist" });
    return;
  }

  task.checklist = Array.isArray(task.checklist) ? task.checklist : [];

  if (!itemId && request.method === "POST") {
    const payload = await readJsonBody(request, response);
    if (!payload) return;

    const text = String(payload.text || "").trim();
    if (!text) {
      sendJson(response, 422, { error: "Checklist item is empty" });
      return;
    }

    task.checklist.push({
      id: uid("cl"),
      text,
      done: false,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
    });
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, "добавил пункт чеклиста");
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  const checklistItem = task.checklist.find((item) => item.id === itemId);
  if (!checklistItem) {
    sendJson(response, 404, { error: "Checklist item not found" });
    return;
  }

  if (request.method === "PATCH") {
    const payload = await readJsonBody(request, response);
    if (!payload) return;

    if ("text" in payload) checklistItem.text = String(payload.text || "").trim();
    if ("done" in payload) {
      checklistItem.done = Boolean(payload.done);
      checklistItem.doneBy = checklistItem.done ? actor.id : null;
      checklistItem.doneAt = checklistItem.done ? new Date().toISOString() : null;
    }
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, checklistItem.done ? "закрыл пункт чеклиста" : "обновил чеклист");
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  if (request.method === "DELETE") {
    task.checklist = task.checklist.filter((item) => item.id !== itemId);
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, "удалил пункт чеклиста");
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  sendJson(response, 405, { error: "Unsupported checklist operation" });
}

async function handleAttachmentRoute(request, response, workspace, actor, taskId, attachmentId) {
  const task = workspace.tasks.find((item) => item.id === taskId);
  if (!task) {
    sendJson(response, 404, { error: "Task not found" });
    return;
  }

  if (!canWorkOnTask(actor, task)) {
    sendJson(response, 403, { error: "Current role cannot update attachments" });
    return;
  }

  task.attachments = Array.isArray(task.attachments) ? task.attachments : [];

  if (!attachmentId && request.method === "POST") {
    const payload = await readJsonBody(request, response);
    if (!payload) return;

    const originalName = String(payload.name || "attachment").trim();
    const type = String(payload.type || "application/octet-stream").trim();
    const base64 = String(payload.data || "");
    const bytes = Buffer.from(base64, "base64");

    if (!bytes.length || bytes.length > maxAttachmentBytes) {
      sendJson(response, 422, { error: "Attachment is empty or too large" });
      return;
    }

    const id = uid("att");
    const safeTaskId = safePathSegment(task.id);
    const safeName = safeFileName(originalName);
    const relativePath = path.posix.join("uploads", safeTaskId, `${id}-${safeName}`);
    const absolutePath = path.join(dataDir, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, bytes);

    task.attachments.push({
      id,
      name: originalName,
      type,
      size: bytes.length,
      path: relativePath,
      url: `/${relativePath.replace(/\\/g, "/")}`,
      uploadedBy: actor.id,
      createdAt: new Date().toISOString(),
    });
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, `добавил вложение ${originalName}`);
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  const attachment = task.attachments.find((item) => item.id === attachmentId);
  if (!attachment) {
    sendJson(response, 404, { error: "Attachment not found" });
    return;
  }

  if (request.method === "DELETE") {
    task.attachments = task.attachments.filter((item) => item.id !== attachmentId);
    if (attachment.path) {
      const absolutePath = path.resolve(dataDir, attachment.path);
      if (absolutePath !== dataDir && absolutePath.startsWith(`${dataDir}${path.sep}`)) {
        await fs.unlink(absolutePath).catch(() => {});
      }
    }
    task.updatedAt = new Date().toISOString();
    addActivity(workspace, actor.id, task.id, `удалил вложение ${attachment.name}`);
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  sendJson(response, 405, { error: "Unsupported attachment operation" });
}

async function handleNotificationRoute(request, response, workspace, actor, notificationId) {
  workspace.notifications = Array.isArray(workspace.notifications) ? workspace.notifications : [];
  const notification = workspace.notifications.find((item) => item.id === notificationId && item.userId === actor.id);
  if (!notification) {
    sendJson(response, 404, { error: "Notification not found" });
    return;
  }

  if (request.method !== "PATCH") {
    sendJson(response, 405, { error: "Unsupported notification operation" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  if ("read" in payload) notification.read = Boolean(payload.read);
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleReadAllNotifications(response, workspace, actor) {
  workspace.notifications = Array.isArray(workspace.notifications) ? workspace.notifications : [];
  workspace.notifications.forEach((notification) => {
    if (notification.userId === actor.id) {
      notification.read = true;
    }
  });
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleCreateUser(request, response, workspace, actor) {
  if (!canManageAccess(actor)) {
    sendJson(response, 403, { error: "Current role cannot manage access" });
    return;
  }

  const payload = await readJsonBody(request, response);
  if (!payload) return;

  const name = String(payload.name || "").trim();
  if (!name) {
    sendJson(response, 422, { error: "User name is required" });
    return;
  }

  const user = {
    id: uid("u"),
    name,
    role: roles[payload.role] ? payload.role : "developer",
    title: String(payload.title || "").trim(),
    color: String(payload.color || randomColor()),
    pin: normalizePin(payload.pin),
  };

  workspace.users.push(user);
  addActivity(workspace, actor.id, null, `добавил пользователя ${user.name}`);
  await writeWorkspace(workspace);
  sendWorkspace(response, workspace);
}

async function handleUserRoute(request, response, workspace, actor, userId) {
  if (!canManageAccess(actor)) {
    sendJson(response, 403, { error: "Current role cannot manage access" });
    return;
  }

  const user = workspace.users.find((item) => item.id === userId);
  if (!user) {
    sendJson(response, 404, { error: "User not found" });
    return;
  }

  if (request.method === "PATCH") {
    const payload = await readJsonBody(request, response);
    if (!payload) return;

    if (payload.role && payload.role !== user.role) {
      if (user.role === "admin" && payload.role !== "admin" && countAdmins(workspace) === 1) {
        sendJson(response, 409, { error: "Workspace must keep at least one admin" });
        return;
      }
      user.role = roles[payload.role] ? payload.role : user.role;
    }

    if ("title" in payload) user.title = String(payload.title || "").trim();
    if ("pin" in payload && String(payload.pin || "").trim()) user.pin = normalizePin(payload.pin);

    addActivity(workspace, actor.id, null, `изменил роль ${user.name}`);
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  if (request.method === "DELETE") {
    if (user.id === actor.id) {
      sendJson(response, 409, { error: "Current user cannot delete self" });
      return;
    }

    if (user.role === "admin" && countAdmins(workspace) === 1) {
      sendJson(response, 409, { error: "Workspace must keep at least one admin" });
      return;
    }

    for (const task of workspace.tasks) {
      task.assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds.filter((id) => id !== user.id) : [];
      if (task.reporterId === user.id) {
        task.reporterId = actor.id;
      }
    }

    workspace.users = workspace.users.filter((item) => item.id !== user.id);
    sessions.forEach((sessionUserId, token) => {
      if (sessionUserId === user.id) sessions.delete(token);
    });
    addActivity(workspace, actor.id, null, `удалил пользователя ${user.name}`);
    await writeWorkspace(workspace);
    sendWorkspace(response, workspace);
    return;
  }

  sendJson(response, 405, { error: "Unsupported user operation" });
}

async function serveStaticFile(urlPathname, response) {
  const pathname = decodeURIComponent(urlPathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = path.resolve(rootDir, `.${requestedPath}`);

  if (absolutePath !== rootDir && !absolutePath.startsWith(`${rootDir}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    sendRaw(response, 200, content, contentTypes[extension] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    throw error;
  }
}

async function serveUploadFile(urlPathname, response) {
  const relativePath = decodeURIComponent(urlPathname.replace(/^\/uploads\//, ""));
  const absolutePath = path.resolve(uploadDir, relativePath);

  if (absolutePath !== uploadDir && !absolutePath.startsWith(`${uploadDir}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    sendRaw(response, 200, content, contentTypes[extension] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    throw error;
  }
}

async function readWorkspace() {
  try {
    const content = await fs.readFile(dataFile, "utf8");
    return normalizeWorkspace(JSON.parse(content));
  } catch (error) {
    if (error.code === "ENOENT") {
      return readExampleWorkspace();
    }
    throw error;
  }
}

async function readExampleWorkspace() {
  try {
    const content = await fs.readFile(exampleDataFile, "utf8");
    return normalizeWorkspace(JSON.parse(content));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { users: [], tasks: [], activities: [] };
    }
    throw error;
  }
}

async function writeWorkspace(workspace) {
  writeQueue = writeQueue.catch(() => {}).then(() => writeWorkspaceNow(workspace));
  await writeQueue;
}

async function writeWorkspaceNow(workspace) {
  await fs.mkdir(dataDir, { recursive: true });
  await backupWorkspaceFile();
  await fs.writeFile(dataFile, `${JSON.stringify(normalizeWorkspace(workspace), null, 2)}\n`, "utf8");
}

async function backupWorkspaceFile() {
  try {
    await fs.access(dataFile);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  await fs.mkdir(backupDir, { recursive: true });
  const backupName = `${timestampForFile()}-${crypto.randomBytes(3).toString("hex")}.workspace.json`;
  await fs.copyFile(dataFile, path.join(backupDir, backupName));
  await pruneBackups();
}

async function pruneBackups() {
  if (!Number.isFinite(maxBackups) || maxBackups <= 0) return;

  const entries = await fs.readdir(backupDir, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });

  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".workspace.json"))
      .map(async (entry) => {
        const fullPath = path.join(backupDir, entry.name);
        const stat = await fs.stat(fullPath);
        return { name: entry.name, fullPath, mtimeMs: stat.mtimeMs };
      }),
  );

  backups
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(maxBackups)
    .forEach((backup) => {
      void fs.unlink(backup.fullPath).catch(() => {});
    });
}

function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > maxBodyBytes) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJsonBody(request, response) {
  const body = await readRequestBody(request);
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    sendJson(response, 400, { error: "Invalid JSON" });
    return null;
  }
}

function authenticate(request, response, workspace) {
  const token = getBearerToken(request);
  const userId = token ? sessions.get(token) : null;
  const user = userId ? workspace.users.find((item) => item.id === userId) : null;

  if (!user) {
    sendJson(response, 401, { error: "Login required" });
    return null;
  }

  return { token, user };
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function isValidWorkspace(payload) {
  return (
    payload &&
    Array.isArray(payload.users) &&
    Array.isArray(payload.tasks) &&
    (!payload.activities || Array.isArray(payload.activities)) &&
    (!payload.notifications || Array.isArray(payload.notifications))
  );
}

function normalizeWorkspace(payload, previousWorkspace = { users: [] }) {
  if (!isValidWorkspace(payload)) {
    return { users: [], tasks: [], activities: [] };
  }

  const previousPins = new Map(previousWorkspace.users.map((user) => [user.id, user.pin]));
  return {
    users: payload.users.map((user) => ({
      id: String(user.id || uid("u")),
      name: String(user.name || "Пользователь").trim(),
      role: roles[user.role] ? user.role : "viewer",
      title: String(user.title || "").trim(),
      color: String(user.color || randomColor()),
      pin: normalizePin(user.pin || previousPins.get(user.id)),
    })),
    tasks: payload.tasks.map(normalizeTask),
    activities: Array.isArray(payload.activities) ? payload.activities : [],
    notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
  };
}

function normalizeTask(task) {
  return {
    id: String(task.id || uid("PLN")),
    title: String(task.title || "").trim(),
    description: String(task.description || "").trim(),
    type: String(task.type || "task"),
    priority: String(task.priority || "medium"),
    status: statuses.has(task.status) ? task.status : "backlog",
    assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds.map(String) : [],
    reporterId: String(task.reporterId || ""),
    sprint: String(task.sprint || "").trim(),
    due: String(task.due || "").trim(),
    points: Number(task.points || 0),
    branch: String(task.branch || "").trim(),
    labels: normalizeLabels(task.labels),
    color: String(task.color || "none"),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    commits: Array.isArray(task.commits) ? task.commits : [],
    comments: Array.isArray(task.comments) ? task.comments : [],
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
  };
}

function sanitizeWorkspaceForClient(workspace) {
  return {
    ...workspace,
    users: workspace.users.map(sanitizeUser),
  };
}

function sanitizeUser(user) {
  const { pin, ...safeUser } = user;
  return safeUser;
}

function sendWorkspace(response, workspace) {
  sendJson(response, 200, sanitizeWorkspaceForClient(workspace));
}

function roleFor(user) {
  return roles[user.role] || roles.viewer;
}

function canManageAccess(user) {
  return roleFor(user).canManageAccess;
}

function canMove(user, task, targetStatus) {
  if (roleFor(user).canMoveAll) return true;
  if (user.role !== "developer") return false;
  if (!Array.isArray(task.assigneeIds) || !task.assigneeIds.includes(user.id)) return false;
  return ["todo", "in_progress", "review"].includes(targetStatus);
}

function canAddCommit(user, task) {
  if (["admin", "manager"].includes(user.role)) return true;
  return user.role === "developer" && Array.isArray(task.assigneeIds) && task.assigneeIds.includes(user.id);
}

function canWorkOnTask(user, task) {
  if (["admin", "manager"].includes(user.role)) return true;
  return user.role === "developer" && Array.isArray(task.assigneeIds) && task.assigneeIds.includes(user.id);
}

function countAdmins(workspace) {
  return workspace.users.filter((user) => user.role === "admin").length;
}

function addActivity(workspace, userId, taskId, text) {
  workspace.activities = Array.isArray(workspace.activities) ? workspace.activities : [];
  workspace.activities.unshift({
    id: uid("a"),
    userId,
    taskId,
    text,
    createdAt: new Date().toISOString(),
  });
}

function notifyUsers(workspace, userIds, actorId, taskId, text) {
  workspace.notifications = Array.isArray(workspace.notifications) ? workspace.notifications : [];
  const uniqueUserIds = [...new Set(userIds)].filter((userId) => userId && userId !== actorId);

  uniqueUserIds.forEach((userId) => {
    if (!workspace.users.some((user) => user.id === userId)) return;
    workspace.notifications.unshift({
      id: uid("ntf"),
      userId,
      actorId,
      taskId,
      text,
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
}

function findMentionedUserIds(workspace, text) {
  const normalizedText = String(text || "").toLowerCase();
  return workspace.users
    .filter((user) => normalizedText.includes(`@${String(user.name).toLowerCase()}`))
    .map((user) => user.id);
}

function normalizeLabels(labels) {
  const source = Array.isArray(labels)
    ? labels
    : String(labels || "")
        .split(",")
        .map((label) => label.trim());

  return [...new Set(source.map((label) => String(label || "").trim()).filter(Boolean))].slice(0, 8);
}

function safePathSegment(value) {
  return String(value || "task").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function safeFileName(value) {
  const cleaned = String(value || "attachment")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 120) || "attachment";
}

function nextTaskId(workspace) {
  const maxNumber = workspace.tasks.reduce((max, task) => {
    const number = Number(String(task.id).replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 180);
  return `PLN-${maxNumber + 1}`;
}

function statusLabel(status) {
  return (
    {
      backlog: "Бэклог",
      todo: "К работе",
      in_progress: "В работе",
      review: "Ревью",
      done: "Готово",
    }[status] || status
  );
}

function normalizePin(pin) {
  const value = String(pin || "1111").trim();
  return value || "1111";
}

function randomColor() {
  const colors = ["#0f766e", "#2864a6", "#6d4cc2", "#9a6700", "#207a44", "#b42318"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-5)}`;
}

function sendJson(response, statusCode, payload) {
  sendRaw(response, statusCode, JSON.stringify(payload), "application/json; charset=utf-8", {
    "Cache-Control": "no-store",
  });
}

function sendRaw(response, statusCode, content, contentType, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(content);
}
