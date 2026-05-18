const STORAGE_KEY = "planum.workspace.v1";
const USER_KEY = "planum.currentUser.v1";
const SESSION_KEY = "planum.session.v1";
const SERVER_POLL_MS = 8000;

const statuses = [
  { id: "backlog", label: "Бэклог", icon: "archive" },
  { id: "todo", label: "К работе", icon: "list-todo" },
  { id: "in_progress", label: "В работе", icon: "loader" },
  { id: "review", label: "Ревью", icon: "git-pull-request" },
  { id: "done", label: "Готово", icon: "check-circle-2" },
];

const roles = {
  admin: {
    label: "Администратор",
    short: "Admin",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canMoveAll: true,
    canManageAccess: true,
  },
  manager: {
    label: "Менеджер",
    short: "PM",
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canMoveAll: true,
    canManageAccess: false,
  },
  developer: {
    label: "Разработчик",
    short: "Dev",
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canMoveAll: false,
    canManageAccess: false,
  },
  viewer: {
    label: "Наблюдатель",
    short: "View",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canMoveAll: false,
    canManageAccess: false,
  },
};

const priorities = {
  blocker: { label: "Блокер", order: 0, className: "priority-blocker" },
  high: { label: "Высокий", order: 1, className: "priority-high" },
  medium: { label: "Средний", order: 2, className: "priority-medium" },
  low: { label: "Низкий", order: 3, className: "priority-low" },
};

const taskTypes = {
  feature: { label: "Фича", className: "feature" },
  bug: { label: "Баг", className: "bug" },
  task: { label: "Задача", className: "task" },
  docs: { label: "Документация", className: "docs" },
};

const seedState = {
  currentUserId: "u-admin",
  users: [
    {
      id: "u-admin",
      name: "Андрей",
      role: "admin",
      title: "Администратор",
      color: "#0f766e",
      pin: "2941",
    },
    {
      id: "u-pm",
      name: "Сергей",
      role: "manager",
      title: "Менеджер",
      color: "#2864a6",
      pin: "5837",
    },
    {
      id: "u-dev-1",
      name: "тест",
      role: "developer",
      title: "Тестовый пользователь",
      color: "#6d4cc2",
      pin: "1111",
    },
    {
      id: "u-dev-2",
      name: "пусто1",
      role: "developer",
      title: "Резерв",
      color: "#9a6700",
      pin: "7426",
    },
    {
      id: "u-viewer",
      name: "пусто2",
      role: "viewer",
      title: "Резерв",
      color: "#66707c",
      pin: "9364",
    },
  ],
  tasks: [
    {
      id: "PLN-184",
      title: "Собрать MVP канбан-доски проекта",
      description:
        "Первый рабочий экран с колонками, задачами, исполнителями, быстрыми фильтрами и карточкой задачи.",
      type: "feature",
      priority: "high",
      status: "in_progress",
      assigneeIds: ["u-dev-1", "u-dev-2"],
      reporterId: "u-admin",
      sprint: "Sprint 12",
      due: "2026-05-23",
      points: 8,
      branch: "feature/project-board",
      createdAt: "2026-05-14T09:00:00.000Z",
      updatedAt: "2026-05-17T15:30:00.000Z",
      commits: [
        {
          id: "c-1",
          hash: "a19d7f2",
          authorId: "u-dev-1",
          branch: "feature/project-board",
          message: "Добавлена сетка колонок и карточки задач",
          createdAt: "2026-05-16T10:20:00.000Z",
        },
        {
          id: "c-2",
          hash: "7c41b8a",
          authorId: "u-dev-2",
          branch: "feature/project-board",
          message: "Подключены фильтры по исполнителям",
          createdAt: "2026-05-17T13:48:00.000Z",
        },
      ],
      comments: [
        {
          id: "cm-1",
          authorId: "u-pm",
          text: "Нужен быстрый переход из карточки к связанным коммитам.",
          createdAt: "2026-05-17T09:15:00.000Z",
        },
      ],
    },
    {
      id: "PLN-185",
      title: "Настроить роли и права доступа",
      description:
        "Администратор управляет пользователями, менеджер ведет задачи, разработчик обновляет назначенные задачи, наблюдатель читает доску.",
      type: "task",
      priority: "blocker",
      status: "review",
      assigneeIds: ["u-dev-2"],
      reporterId: "u-admin",
      sprint: "Sprint 12",
      due: "2026-05-20",
      points: 5,
      branch: "feature/access-rules",
      createdAt: "2026-05-15T11:00:00.000Z",
      updatedAt: "2026-05-18T08:35:00.000Z",
      commits: [
        {
          id: "c-3",
          hash: "0e8f9ab",
          authorId: "u-dev-2",
          branch: "feature/access-rules",
          message: "Ограничены действия для наблюдателей",
          createdAt: "2026-05-18T08:20:00.000Z",
        },
      ],
      comments: [],
    },
    {
      id: "PLN-186",
      title: "Связать задачи с ветками репозитория",
      description:
        "В карточке задачи должна быть видна ветка, история коммитов и последние изменения по задаче.",
      type: "feature",
      priority: "medium",
      status: "todo",
      assigneeIds: ["u-dev-1"],
      reporterId: "u-pm",
      sprint: "Sprint 12",
      due: "2026-05-27",
      points: 3,
      branch: "feature/git-links",
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z",
      commits: [],
      comments: [],
    },
    {
      id: "PLN-187",
      title: "Исправить дублирование задач при фильтрации",
      description:
        "После сброса фильтров карточки не должны повторяться, а счетчики колонок должны совпадать с видимыми задачами.",
      type: "bug",
      priority: "high",
      status: "backlog",
      assigneeIds: [],
      reporterId: "u-pm",
      sprint: "Inbox",
      due: "2026-05-25",
      points: 2,
      branch: "bugfix/filter-duplicates",
      createdAt: "2026-05-17T12:00:00.000Z",
      updatedAt: "2026-05-17T12:00:00.000Z",
      commits: [],
      comments: [],
    },
    {
      id: "PLN-188",
      title: "Описать процесс перевода задач между этапами",
      description:
        "Короткий документ для команды: кто может менять статус, когда задача уходит на ревью и кто закрывает готовые задачи.",
      type: "docs",
      priority: "low",
      status: "done",
      assigneeIds: ["u-pm"],
      reporterId: "u-admin",
      sprint: "Sprint 11",
      due: "2026-05-17",
      points: 1,
      branch: "docs/task-workflow",
      createdAt: "2026-05-10T10:30:00.000Z",
      updatedAt: "2026-05-17T16:40:00.000Z",
      commits: [
        {
          id: "c-4",
          hash: "d2a4ce1",
          authorId: "u-pm",
          branch: "docs/task-workflow",
          message: "Добавлен регламент статусов задач",
          createdAt: "2026-05-17T16:36:00.000Z",
        },
      ],
      comments: [],
    },
  ],
  activities: [
    {
      id: "a-1",
      userId: "u-dev-2",
      taskId: "PLN-185",
      text: "добавил коммит 0e8f9ab",
      createdAt: "2026-05-18T08:20:00.000Z",
    },
    {
      id: "a-2",
      userId: "u-pm",
      taskId: "PLN-184",
      text: "оставил комментарий",
      createdAt: "2026-05-17T09:15:00.000Z",
    },
    {
      id: "a-3",
      userId: "u-pm",
      taskId: "PLN-188",
      text: "перевел задачу в Готово",
      createdAt: "2026-05-17T16:40:00.000Z",
    },
  ],
};

let state = clone(seedState);
let sessionUserId = localStorage.getItem(USER_KEY) || seedState.currentUserId;
let sessionToken = localStorage.getItem(SESSION_KEY) || "";
let apiAvailable = false;
let lastSavedPayload = "";
let activeTaskId = null;
let toastTimer = null;
let syncTimer = null;

const elements = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  bindEvents();
  fillStaticSelects();
  state = await loadState();
  ensureCurrentUser();
  await restoreSession();
  startRemotePolling();
  render();
  if (canUseApi() && !sessionToken) {
    openLoginModal(sessionUserId);
  }
});

function cacheElements() {
  [
    "currentUserSelect",
    "currentRole",
    "syncStatus",
    "loginButton",
    "newTaskButton",
    "resetButton",
    "accessButton",
    "teamCount",
    "teamList",
    "metricsRow",
    "searchInput",
    "statusFilter",
    "assigneeFilter",
    "scopeFilter",
    "kanbanBoard",
    "activityCount",
    "activityFeed",
    "taskDrawer",
    "taskDetails",
    "loginModal",
    "loginForm",
    "loginCancelButton",
    "taskModal",
    "taskModalTitle",
    "taskModalSubtitle",
    "taskForm",
    "assigneePicker",
    "accessModal",
    "accessSubtitle",
    "accessList",
    "userForm",
    "toast",
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.currentUserSelect.addEventListener("change", (event) => {
    if (canUseApi()) {
      const requestedUserId = event.target.value;
      elements.currentUserSelect.value = sessionUserId;
      openLoginModal(requestedUserId);
      return;
    }

    sessionUserId = event.target.value;
    localStorage.setItem(USER_KEY, sessionUserId);
    render();
    if (activeTaskId) {
      renderTaskDetails();
    }
  });

  elements.newTaskButton.addEventListener("click", () => {
    if (canUseApi() && !sessionToken) {
      openLoginModal(sessionUserId);
      return;
    }

    if (!currentRole().canCreate) {
      showToast("У текущей роли нет права создавать задачи.");
      return;
    }
    openTaskForm();
  });

  elements.resetButton.addEventListener("click", () => {
    void resetWorkspace();
  });

  elements.loginButton.addEventListener("click", () => openLoginModal(sessionUserId));
  elements.loginCancelButton.addEventListener("click", closeLoginModal);
  elements.loginForm.addEventListener("submit", handleLoginSubmit);

  elements.accessButton.addEventListener("click", openAccessModal);

  elements.searchInput.addEventListener("input", renderBoard);
  elements.statusFilter.addEventListener("change", renderBoard);
  elements.assigneeFilter.addEventListener("change", renderBoard);
  elements.scopeFilter.addEventListener("change", renderBoard);

  document.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", closeTaskModal);
  });

  document.querySelectorAll("[data-close-access]").forEach((node) => {
    node.addEventListener("click", closeAccessModal);
  });

  document.querySelectorAll("[data-close-drawer]").forEach((node) => {
    node.addEventListener("click", closeTaskDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTaskModal();
      closeAccessModal();
      closeTaskDrawer();
    }
  });

  elements.taskForm.addEventListener("submit", handleTaskFormSubmit);
  elements.userForm.addEventListener("submit", handleUserFormSubmit);
}

function fillStaticSelects() {
  elements.statusFilter.innerHTML =
    `<option value="all">Все статусы</option>` +
    statuses.map((status) => `<option value="${status.id}">${status.label}</option>`).join("");

  const form = elements.taskForm;
  form.elements.type.innerHTML = Object.entries(taskTypes)
    .map(([id, type]) => `<option value="${id}">${type.label}</option>`)
    .join("");
  form.elements.priority.innerHTML = Object.entries(priorities)
    .map(([id, priority]) => `<option value="${id}">${priority.label}</option>`)
    .join("");
  form.elements.status.innerHTML = statuses
    .map((status) => `<option value="${status.id}">${status.label}</option>`)
    .join("");

  elements.userForm.elements.role.innerHTML = Object.entries(roles)
    .map(([id, role]) => `<option value="${id}">${role.label}</option>`)
    .join("");
}

function render() {
  ensureCurrentUser();
  renderHeader();
  renderTeam();
  renderMetrics();
  renderFilters();
  renderBoard();
  renderActivity();
  if (!elements.accessModal.hidden) {
    renderAccessModal();
  }
  refreshIcons();
}

function renderHeader() {
  const selectedUser = currentUser();
  elements.currentUserSelect.innerHTML = state.users
    .map(
      (user) =>
        `<option value="${escapeAttr(user.id)}" ${user.id === selectedUser.id ? "selected" : ""}>${escapeHtml(
          user.name,
        )}</option>`,
    )
    .join("");
  const loggedIn = !canUseApi() || Boolean(sessionToken);
  elements.currentRole.textContent = loggedIn
    ? `${roles[selectedUser.role].label} · ${selectedUser.title || "Команда"}`
    : "Нужно войти";
  elements.loginButton.title = loggedIn ? "Сменить пользователя" : "Войти";
  elements.newTaskButton.disabled = !loggedIn || !currentRole().canCreate;
  elements.newTaskButton.classList.toggle("locked", !loggedIn || !currentRole().canCreate);
  updateSyncStatus();
}

function renderTeam() {
  elements.teamCount.textContent = `${state.users.length}`;
  elements.teamList.innerHTML = state.users
    .map((user) => {
      const role = roles[user.role];
      return `
        <div class="person-row ${user.id === sessionUserId ? "current" : ""}">
          ${renderAvatar(user)}
          <div class="person-main">
            <strong>${escapeHtml(user.name)}</strong>
            <span>${role.label} · ${escapeHtml(user.title || "Без должности")}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMetrics() {
  const openTasks = state.tasks.filter((task) => task.status !== "done").length;
  const inProgress = state.tasks.filter((task) => task.status === "in_progress").length;
  const review = state.tasks.filter((task) => task.status === "review").length;
  const blockers = state.tasks.filter((task) => task.priority === "blocker" && task.status !== "done").length;
  const dueSoon = state.tasks.filter((task) => isDueSoon(task) && task.status !== "done").length;

  const metrics = [
    { label: "Открыто", value: openTasks, icon: "folder-open" },
    { label: "В работе", value: inProgress, icon: "loader" },
    { label: "На ревью", value: review, icon: "git-pull-request" },
    { label: "Блокеры", value: blockers, icon: "octagon-alert" },
    { label: "Скоро срок", value: dueSoon, icon: "calendar-clock" },
  ];

  elements.metricsRow.innerHTML = metrics
    .map(
      (metric) => `
        <div class="metric">
          <div>
            <strong>${metric.value}</strong>
            <span>${metric.label}</span>
          </div>
          <i data-lucide="${metric.icon}"></i>
        </div>
      `,
    )
    .join("");
}

function renderFilters() {
  const previousValue = elements.assigneeFilter.value || "all";
  elements.assigneeFilter.innerHTML =
    `<option value="all">Все</option><option value="none">Без исполнителя</option>` +
    state.users.map((user) => `<option value="${escapeAttr(user.id)}">${escapeHtml(user.name)}</option>`).join("");
  elements.assigneeFilter.value =
    previousValue === "all" || previousValue === "none" || state.users.some((user) => user.id === previousValue)
      ? previousValue
      : "all";
}

function renderBoard() {
  const tasks = getFilteredTasks();
  elements.kanbanBoard.innerHTML = statuses
    .map((status) => {
      const columnTasks = tasks.filter((task) => task.status === status.id);
      return `
        <section class="kanban-column" data-status="${status.id}">
          <div class="column-header">
            <h3><i data-lucide="${status.icon}"></i> ${status.label}</h3>
            <span class="column-count">${columnTasks.length}</span>
          </div>
          <div class="task-list">
            ${
              columnTasks.length
                ? columnTasks.map((task) => renderTaskCard(task)).join("")
                : `<div class="empty-column">Нет задач</div>`
            }
          </div>
        </section>
      `;
    })
    .join("");

  elements.kanbanBoard.querySelectorAll(".column-header h3").forEach((heading) => {
    heading.style.display = "inline-flex";
    heading.style.alignItems = "center";
    heading.style.gap = "6px";
  });

  wireTaskCards();
  wireDropTargets();
  refreshIcons();
}

function renderTaskCard(task) {
  const type = taskTypes[task.type] || taskTypes.task;
  const priority = priorities[task.priority] || priorities.medium;
  const assignedUsers = task.assigneeIds.map(getUser).filter(Boolean);
  const canDrag = canDragTask(task);
  const dueClass = isOverdue(task) ? "overdue" : "";

  return `
    <article class="task-card ${canDrag ? "" : "locked"}" data-task-id="${escapeAttr(task.id)}" draggable="${canDrag}">
      <div class="task-meta">
        <span class="task-key">${escapeHtml(task.id)}</span>
        <span class="tag ${type.className}">${type.label}</span>
        <span class="chip ${priority.className} ${dueClass}">${priority.label}</span>
      </div>
      <h4 class="task-title">${escapeHtml(task.title)}</h4>
      <div class="task-meta">
        <span class="icon-stat" title="Ветка"><i data-lucide="git-branch"></i>${escapeHtml(task.branch || "нет ветки")}</span>
        <span class="icon-stat" title="Оценка"><i data-lucide="gauge"></i>${Number(task.points || 0)}</span>
      </div>
      <div class="task-footer">
        <div class="avatars" title="Исполнители">
          ${
            assignedUsers.length
              ? assignedUsers.map((user) => renderAvatar(user, "mini-avatar")).join("")
              : `<span class="muted">не назначена</span>`
          }
        </div>
        <div class="task-meta">
          <span class="icon-stat" title="Коммиты"><i data-lucide="git-commit-horizontal"></i>${task.commits.length}</span>
          <span class="icon-stat" title="Комментарии"><i data-lucide="message-square"></i>${task.comments.length}</span>
        </div>
      </div>
    </article>
  `;
}

function wireTaskCards() {
  elements.kanbanBoard.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", () => openTaskDrawer(card.dataset.taskId));

    card.addEventListener("dragstart", (event) => {
      if (card.getAttribute("draggable") !== "true") {
        event.preventDefault();
        return;
      }
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.taskId);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });
}

function wireDropTargets() {
  elements.kanbanBoard.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) {
        column.classList.remove("drag-over");
      }
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const taskId = event.dataTransfer.getData("text/plain");
      moveTask(taskId, column.dataset.status);
    });
  });
}

function renderActivity() {
  const items = [...state.activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  elements.activityCount.textContent = `${items.length}`;
  elements.activityFeed.innerHTML = items.length
    ? items
        .map((item) => {
          const user = getUser(item.userId);
          const task = getTask(item.taskId);
          return `
            <div class="activity-item">
              <span class="activity-dot"></span>
              <div class="activity-text">
                <strong>${escapeHtml(user?.name || "Система")}</strong>
                ${escapeHtml(item.text)}
                ${task ? `<strong>${escapeHtml(task.id)}</strong>` : ""}
                <span class="activity-time">${formatDateTime(item.createdAt)}</span>
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">Нет активности</div>`;
}

function openTaskDrawer(taskId) {
  activeTaskId = taskId;
  elements.taskDrawer.hidden = false;
  renderTaskDetails();
}

function closeTaskDrawer() {
  activeTaskId = null;
  elements.taskDrawer.hidden = true;
}

function openLoginModal(selectedUserId = sessionUserId) {
  if (!canUseApi()) {
    showToast("При открытии через файл вход не требуется.");
    return;
  }

  const form = elements.loginForm;
  form.elements.userId.innerHTML = state.users
    .map((user) => `<option value="${escapeAttr(user.id)}">${escapeHtml(user.name)} · ${roles[user.role]?.label || ""}</option>`)
    .join("");
  form.elements.userId.value = state.users.some((user) => user.id === selectedUserId) ? selectedUserId : state.users[0]?.id || "";
  form.elements.pin.value = "";
  elements.loginCancelButton.hidden = !sessionToken;
  elements.loginModal.hidden = false;
  form.elements.pin.focus();
  refreshIcons();
}

function closeLoginModal() {
  if (!sessionToken && canUseApi()) {
    return;
  }

  elements.loginModal.hidden = true;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const userId = form.elements.userId.value;
  const pin = form.elements.pin.value;

  try {
    const result = await apiRequest("/api/login", {
      method: "POST",
      body: { userId, pin },
      skipAuth: true,
    });

    sessionToken = result.token;
    sessionUserId = result.user.id;
    localStorage.setItem(SESSION_KEY, sessionToken);
    localStorage.setItem(USER_KEY, sessionUserId);
    elements.loginModal.hidden = true;
    await refreshRemoteState({ force: true });
    render();
    showToast("Вход выполнен.");
  } catch {
    showToast("Неверный PIN.");
  }
}

function renderTaskDetails() {
  const task = getTask(activeTaskId);
  if (!task) {
    closeTaskDrawer();
    return;
  }

  const type = taskTypes[task.type] || taskTypes.task;
  const priority = priorities[task.priority] || priorities.medium;
  const reporter = getUser(task.reporterId);
  const assignedUsers = task.assigneeIds.map(getUser).filter(Boolean);
  const currentStatus = statuses.find((status) => status.id === task.status);
  const canEditTask = canEdit(task);
  const canDeleteTask = canDelete(task);
  const canCommit = canAddCommit(task);
  const canCommentTask = canComment(task);

  elements.taskDetails.innerHTML = `
    <div class="drawer-content">
      <div class="drawer-title-row">
        <div>
          <div class="task-meta">
            <span class="task-key">${escapeHtml(task.id)}</span>
            <span class="tag ${type.className}">${type.label}</span>
            <span class="chip ${priority.className}">${priority.label}</span>
            <span class="status-chip chip blue">${currentStatus?.label || "Без статуса"}</span>
          </div>
          <h2 id="drawerTitle">${escapeHtml(task.title)}</h2>
          <div class="drawer-subtitle">Обновлено ${formatDateTime(task.updatedAt)}</div>
        </div>
        <button class="icon-button ghost" type="button" data-close-detail title="Закрыть">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="drawer-actions">
        <label class="field">
          <span>Статус</span>
          <select id="detailStatusSelect">
            ${statuses
              .map((status) => `<option value="${status.id}" ${status.id === task.status ? "selected" : ""}>${status.label}</option>`)
              .join("")}
          </select>
        </label>
        ${
          canEditTask
            ? `<button class="secondary-button" type="button" id="editTaskButton"><i data-lucide="pencil"></i><span>Редактировать</span></button>`
            : ""
        }
        ${
          canDeleteTask
            ? `<button class="danger-button" type="button" id="deleteTaskButton"><i data-lucide="trash-2"></i><span>Удалить</span></button>`
            : ""
        }
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <span>Исполнители</span>
          <div class="avatars">
            ${
              assignedUsers.length
                ? assignedUsers.map((user) => renderAvatar(user, "mini-avatar")).join("") +
                  assignedUsers.map((user) => `<strong>${escapeHtml(user.name)}</strong>`).join(", ")
                : "Не назначена"
            }
          </div>
        </div>
        <div class="detail-box">
          <span>Постановщик</span>
          <strong>${escapeHtml(reporter?.name || "Не указан")}</strong>
        </div>
        <div class="detail-box">
          <span>Спринт</span>
          <strong>${escapeHtml(task.sprint || "Не указан")}</strong>
        </div>
        <div class="detail-box">
          <span>Срок</span>
          <strong>${task.due ? formatDate(task.due) : "Не указан"}</strong>
        </div>
        <div class="detail-box">
          <span>Оценка</span>
          <strong>${Number(task.points || 0)}</strong>
        </div>
        <div class="detail-box">
          <span>Ветка</span>
          <strong>${escapeHtml(task.branch || "Нет ветки")}</strong>
        </div>
      </div>

      <section class="drawer-section">
        <h3 class="section-title">Описание</h3>
        <div class="description-box">${escapeHtml(task.description || "Описание не заполнено.")}</div>
      </section>

      <section class="drawer-section">
        <h3 class="section-title">Коммиты</h3>
        <div class="commit-list">
          ${
            task.commits.length
              ? [...task.commits]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(renderCommit)
                  .join("")
              : `<div class="empty-state">Нет коммитов</div>`
          }
        </div>
        <form id="commitForm" class="inline-form">
          <div class="commit-form-grid">
            <label class="field">
              <span>Hash</span>
              <input name="hash" type="text" maxlength="12" ${canCommit ? "" : "disabled"} required />
            </label>
            <label class="field">
              <span>Сообщение</span>
              <input name="message" type="text" maxlength="160" ${canCommit ? "" : "disabled"} required />
            </label>
          </div>
          <label class="field">
            <span>Ветка</span>
            <input name="branch" type="text" maxlength="80" value="${escapeAttr(task.branch || "")}" ${canCommit ? "" : "disabled"} />
          </label>
          <button class="secondary-button" type="submit" ${canCommit ? "" : "disabled"}>
            <i data-lucide="git-commit-horizontal"></i>
            <span>Добавить коммит</span>
          </button>
        </form>
      </section>

      <section class="drawer-section">
        <h3 class="section-title">Комментарии</h3>
        <div class="comment-list">
          ${
            task.comments.length
              ? [...task.comments]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(renderComment)
                  .join("")
              : `<div class="empty-state">Нет комментариев</div>`
          }
        </div>
        <form id="commentForm" class="comment-form">
          <label class="field">
            <span>Комментарий</span>
            <textarea name="text" rows="3" maxlength="600" ${canCommentTask ? "" : "disabled"} required></textarea>
          </label>
          <button class="secondary-button" type="submit" ${canCommentTask ? "" : "disabled"}>
            <i data-lucide="message-square-plus"></i>
            <span>Отправить</span>
          </button>
        </form>
      </section>
    </div>
  `;

  elements.taskDetails.querySelector("[data-close-detail]").addEventListener("click", closeTaskDrawer);
  elements.taskDetails.querySelector("#detailStatusSelect").addEventListener("change", (event) => {
    moveTask(task.id, event.target.value);
  });

  const editButton = elements.taskDetails.querySelector("#editTaskButton");
  if (editButton) {
    editButton.addEventListener("click", () => openTaskForm(task.id));
  }

  const deleteButton = elements.taskDetails.querySelector("#deleteTaskButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => deleteTask(task.id));
  }

  elements.taskDetails.querySelector("#commitForm").addEventListener("submit", handleCommitSubmit);
  elements.taskDetails.querySelector("#commentForm").addEventListener("submit", handleCommentSubmit);
  refreshIcons();
}

function renderCommit(commit) {
  const author = getUser(commit.authorId);
  return `
    <div class="commit-row">
      ${author ? renderAvatar(author, "mini-avatar") : ""}
      <div class="commit-message">
        <span class="commit-hash">${escapeHtml(commit.hash)}</span>
        <strong>${escapeHtml(commit.message)}</strong>
        <div class="muted">${escapeHtml(author?.name || "Неизвестно")} · ${escapeHtml(commit.branch || "без ветки")} · ${formatDateTime(
          commit.createdAt,
        )}</div>
      </div>
    </div>
  `;
}

function renderComment(comment) {
  const author = getUser(comment.authorId);
  return `
    <div class="comment-row">
      ${author ? renderAvatar(author, "mini-avatar") : ""}
      <div class="comment-text">
        <strong>${escapeHtml(author?.name || "Неизвестно")}</strong>
        <div>${escapeHtml(comment.text)}</div>
        <span class="muted">${formatDateTime(comment.createdAt)}</span>
      </div>
    </div>
  `;
}

function openTaskForm(taskId = null) {
  const task = taskId ? getTask(taskId) : null;
  if (task && !canEdit(task)) {
    showToast("У текущей роли нет права редактировать эту задачу.");
    return;
  }

  elements.taskModal.hidden = false;
  elements.taskModalTitle.textContent = task ? "Редактировать задачу" : "Новая задача";
  elements.taskModalSubtitle.textContent = task ? task.id : "Постановка задачи";

  const form = elements.taskForm;
  form.elements.taskId.value = task?.id || "";
  form.elements.title.value = task?.title || "";
  form.elements.description.value = task?.description || "";
  form.elements.type.value = task?.type || "task";
  form.elements.priority.value = task?.priority || "medium";
  form.elements.status.value = task?.status || "backlog";
  form.elements.sprint.value = task?.sprint || "";
  form.elements.due.value = task?.due || "";
  form.elements.points.value = task?.points ?? "";
  form.elements.branch.value = task?.branch || "";

  elements.assigneePicker.innerHTML = state.users
    .filter((user) => user.role !== "viewer")
    .map((user) => {
      const checked = task?.assigneeIds.includes(user.id) ? "checked" : "";
      return `
        <label class="picker-item">
          <input type="checkbox" name="assigneeIds" value="${escapeAttr(user.id)}" ${checked} />
          ${renderAvatar(user, "mini-avatar")}
          <span>${escapeHtml(user.name)}</span>
        </label>
      `;
    })
    .join("");

  refreshIcons();
}

function closeTaskModal() {
  elements.taskModal.hidden = true;
}

async function handleTaskFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const taskId = form.elements.taskId.value;
  const existingTask = taskId ? getTask(taskId) : null;

  if (existingTask && !canEdit(existingTask)) {
    showToast("У текущей роли нет права редактировать эту задачу.");
    return;
  }

  if (!existingTask && !currentRole().canCreate) {
    showToast("У текущей роли нет права создавать задачи.");
    return;
  }

  const assigneeIds = [...form.querySelectorAll("input[name='assigneeIds']:checked")].map((input) => input.value);
  const payload = {
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    type: form.elements.type.value,
    priority: form.elements.priority.value,
    status: form.elements.status.value,
    sprint: form.elements.sprint.value.trim(),
    due: form.elements.due.value,
    points: Number(form.elements.points.value || 0),
    branch: form.elements.branch.value.trim(),
    assigneeIds,
    updatedAt: new Date().toISOString(),
  };

  if (!payload.title) {
    showToast("Название задачи обязательно.");
    return;
  }

  if (shouldUseServerMutations()) {
    const previousIds = new Set(state.tasks.map((task) => task.id));
    const nextState = await applyServerMutation(existingTask ? `/api/tasks/${encodeURIComponent(existingTask.id)}` : "/api/tasks", {
      method: existingTask ? "PATCH" : "POST",
      body: payload,
    });

    if (!nextState) return;

    if (!existingTask) {
      const createdTask = nextState.tasks.find((task) => !previousIds.has(task.id));
      activeTaskId = createdTask?.id || null;
    }

    closeTaskModal();
    render();
    if (activeTaskId) {
      elements.taskDrawer.hidden = false;
      renderTaskDetails();
    }
    showToast(existingTask ? `${existingTask.id} сохранена.` : `${activeTaskId || "Задача"} создана.`);
    return;
  }

  if (existingTask) {
    Object.assign(existingTask, payload);
    addActivity(existingTask.id, "обновил задачу");
    showToast(`${existingTask.id} сохранена.`);
  } else {
    const newTask = {
      id: nextTaskId(),
      ...payload,
      reporterId: currentUser().id,
      createdAt: new Date().toISOString(),
      commits: [],
      comments: [],
    };
    state.tasks.unshift(newTask);
    activeTaskId = newTask.id;
    addActivity(newTask.id, "создал задачу");
    showToast(`${newTask.id} создана.`);
  }

  saveState();
  closeTaskModal();
  render();
  if (activeTaskId) {
    elements.taskDrawer.hidden = false;
    renderTaskDetails();
  }
}

function openAccessModal() {
  if (canUseApi() && !sessionToken) {
    openLoginModal(sessionUserId);
    return;
  }

  elements.accessModal.hidden = false;
  renderAccessModal();
}

function closeAccessModal() {
  elements.accessModal.hidden = true;
}

function renderAccessModal() {
  const canManage = currentRole().canManageAccess;
  elements.accessSubtitle.textContent = canManage ? "Управление ролями команды" : "Текущий режим только для чтения";
  elements.userForm.hidden = !canManage;

  elements.accessList.innerHTML = state.users
    .map((user) => {
      const canRemove = canManage && user.id !== sessionUserId;
      return `
        <div class="access-row">
          <div class="person-row">
            ${renderAvatar(user)}
            <div class="person-main">
              <strong>${escapeHtml(user.name)}</strong>
              <span>${escapeHtml(user.title || "Без должности")}</span>
            </div>
          </div>
          <label class="field">
            <span>Роль</span>
            <select class="access-role-select" data-user-id="${escapeAttr(user.id)}" ${canManage ? "" : "disabled"}>
              ${Object.entries(roles)
                .map(([id, role]) => `<option value="${id}" ${id === user.role ? "selected" : ""}>${role.label}</option>`)
                .join("")}
            </select>
          </label>
          <span class="role-pill">${roles[user.role].short}</span>
          <div class="row-actions">
            <button class="icon-button ghost remove-user-button" type="button" title="Удалить" data-user-id="${escapeAttr(
              user.id,
            )}" ${canRemove ? "" : "disabled"}>
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  elements.accessList.querySelectorAll(".access-role-select").forEach((select) => {
    select.addEventListener("change", (event) => updateUserRole(event.target.dataset.userId, event.target.value));
  });

  elements.accessList.querySelectorAll(".remove-user-button").forEach((button) => {
    button.addEventListener("click", () => removeUser(button.dataset.userId));
  });

  refreshIcons();
}

async function handleUserFormSubmit(event) {
  event.preventDefault();
  if (!currentRole().canManageAccess) {
    showToast("У текущей роли нет права управлять доступами.");
    return;
  }

  const form = event.currentTarget;
  const user = {
    id: uid("u"),
    name: form.elements.name.value.trim(),
    role: form.elements.role.value,
    title: form.elements.title.value.trim(),
    pin: form.elements.pin.value.trim() || "1111",
    color: randomColor(),
  };

  if (!user.name) {
    showToast("Имя пользователя обязательно.");
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation("/api/users", {
      method: "POST",
      body: user,
    });
    if (nextState) {
      form.reset();
      renderAccessModal();
      showToast("Пользователь добавлен.");
    }
    return;
  }

  state.users.push(user);
  addSystemActivity(`добавил пользователя ${user.name}`);
  saveState();
  form.reset();
  render();
  renderAccessModal();
  showToast("Пользователь добавлен.");
}

async function updateUserRole(userId, role) {
  if (!currentRole().canManageAccess) {
    showToast("У текущей роли нет права управлять доступами.");
    renderAccessModal();
    return;
  }

  const user = getUser(userId);
  if (!user) return;

  const admins = state.users.filter((item) => item.role === "admin");
  if (user.role === "admin" && role !== "admin" && admins.length === 1) {
    showToast("В команде должен остаться хотя бы один администратор.");
    renderAccessModal();
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { role },
    });
    if (nextState) {
      renderAccessModal();
    }
    return;
  }

  user.role = role;
  addSystemActivity(`изменил роль ${user.name}`);
  saveState();
  render();
  renderAccessModal();
}

async function removeUser(userId) {
  if (!currentRole().canManageAccess) {
    showToast("У текущей роли нет права управлять доступами.");
    return;
  }

  const user = getUser(userId);
  if (!user || user.id === sessionUserId) return;

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (nextState) {
      renderAccessModal();
      showToast("Пользователь удален.");
    }
    return;
  }

  state.tasks.forEach((task) => {
    task.assigneeIds = task.assigneeIds.filter((id) => id !== userId);
    if (task.reporterId === userId) {
      task.reporterId = sessionUserId;
    }
  });
  state.users = state.users.filter((item) => item.id !== userId);
  addSystemActivity(`удалил пользователя ${user.name}`);
  saveState();
  render();
  renderAccessModal();
  showToast("Пользователь удален.");
}

async function moveTask(taskId, targetStatus) {
  const task = getTask(taskId);
  if (!task || task.status === targetStatus) {
    renderBoard();
    if (activeTaskId) renderTaskDetails();
    return;
  }

  if (!canMove(task, targetStatus)) {
    showToast("У текущей роли нет права перевести задачу в этот статус.");
    renderBoard();
    if (activeTaskId) renderTaskDetails();
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/tasks/${encodeURIComponent(task.id)}/status`, {
      method: "PATCH",
      body: { status: targetStatus },
    });
    if (nextState && activeTaskId === task.id) renderTaskDetails();
    return;
  }

  const statusLabel = statuses.find((status) => status.id === targetStatus)?.label || targetStatus;
  task.status = targetStatus;
  task.updatedAt = new Date().toISOString();
  addActivity(task.id, `перевел задачу в ${statusLabel}`);
  saveState();
  render();
  if (activeTaskId === task.id) renderTaskDetails();
}

async function deleteTask(taskId) {
  const task = getTask(taskId);
  if (!task || !canDelete(task)) {
    showToast("Удалять задачи может только администратор.");
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
    if (nextState) {
      closeTaskDrawer();
      render();
      showToast(`${taskId} удалена.`);
    }
    return;
  }

  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  addSystemActivity(`удалил задачу ${taskId}`);
  saveState();
  closeTaskDrawer();
  render();
  showToast(`${taskId} удалена.`);
}

async function handleCommitSubmit(event) {
  event.preventDefault();
  const task = getTask(activeTaskId);
  if (!task || !canAddCommit(task)) {
    showToast("У текущей роли нет права добавлять коммиты к этой задаче.");
    return;
  }

  const form = event.currentTarget;
  const hash = form.elements.hash.value.trim().replace(/[^a-fA-F0-9]/g, "").slice(0, 12);
  const message = form.elements.message.value.trim();
  const branch = form.elements.branch.value.trim();

  if (!hash || !message) {
    showToast("Hash и сообщение коммита обязательны.");
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/tasks/${encodeURIComponent(task.id)}/commits`, {
      method: "POST",
      body: { hash, message, branch },
    });
    if (nextState) {
      form.reset();
      renderTaskDetails();
    }
    return;
  }

  task.commits.push({
    id: uid("c"),
    hash,
    authorId: currentUser().id,
    branch,
    message,
    createdAt: new Date().toISOString(),
  });
  task.branch = branch || task.branch;
  task.updatedAt = new Date().toISOString();
  addActivity(task.id, `добавил коммит ${hash}`);
  saveState();
  form.reset();
  render();
  renderTaskDetails();
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  const task = getTask(activeTaskId);
  if (!task || !canComment(task)) {
    showToast("У текущей роли нет права комментировать эту задачу.");
    return;
  }

  const form = event.currentTarget;
  const text = form.elements.text.value.trim();
  if (!text) {
    showToast("Комментарий пустой.");
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation(`/api/tasks/${encodeURIComponent(task.id)}/comments`, {
      method: "POST",
      body: { text },
    });
    if (nextState) {
      form.reset();
      renderTaskDetails();
    }
    return;
  }

  task.comments.push({
    id: uid("cm"),
    authorId: currentUser().id,
    text,
    createdAt: new Date().toISOString(),
  });
  task.updatedAt = new Date().toISOString();
  addActivity(task.id, "оставил комментарий");
  saveState();
  form.reset();
  render();
  renderTaskDetails();
}

function getFilteredTasks() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const assignee = elements.assigneeFilter.value;
  const scope = elements.scopeFilter.value;
  const user = currentUser();

  return [...state.tasks]
    .filter((task) => {
      const haystack = [
        task.id,
        task.title,
        task.description,
        task.branch,
        task.sprint,
        ...task.commits.map((commit) => `${commit.hash} ${commit.message} ${commit.branch}`),
      ]
        .join(" ")
        .toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (status !== "all" && task.status !== status) return false;
      if (assignee === "none" && task.assigneeIds.length) return false;
      if (assignee !== "all" && assignee !== "none" && !task.assigneeIds.includes(assignee)) return false;
      if (scope === "mine" && !task.assigneeIds.includes(user.id) && task.reporterId !== user.id) return false;
      if (scope === "unassigned" && task.assigneeIds.length) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityDiff = (priorities[a.priority]?.order ?? 99) - (priorities[b.priority]?.order ?? 99);
      if (priorityDiff) return priorityDiff;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

function canEdit(task) {
  return currentRole().canEdit && Boolean(task);
}

function canDelete(task) {
  return currentRole().canDelete && Boolean(task);
}

function canDragTask(task) {
  if (canUseApi() && !sessionToken) return false;
  if (currentRole().canMoveAll) return true;
  return currentUser().role === "developer" && task.assigneeIds.includes(currentUser().id);
}

function canMove(task, targetStatus) {
  if (canUseApi() && !sessionToken) return false;
  if (currentRole().canMoveAll) return true;
  if (currentUser().role !== "developer") return false;
  if (!task.assigneeIds.includes(currentUser().id)) return false;
  return ["todo", "in_progress", "review"].includes(targetStatus);
}

function canAddCommit(task) {
  if (!task) return false;
  if (canUseApi() && !sessionToken) return false;
  if (["admin", "manager"].includes(currentUser().role)) return true;
  return currentUser().role === "developer" && task.assigneeIds.includes(currentUser().id);
}

function canComment(task) {
  if (!task) return false;
  if (canUseApi() && !sessionToken) return false;
  return currentUser().role !== "viewer";
}

function currentUser() {
  return getUser(sessionUserId) || state.users[0];
}

function currentRole() {
  if (canUseApi() && !sessionToken) return roles.viewer;
  return roles[currentUser().role] || roles.viewer;
}

function getUser(userId) {
  return state.users.find((user) => user.id === userId);
}

function getTask(taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function ensureCurrentUser() {
  if (!state.users.some((user) => user.id === sessionUserId)) {
    sessionUserId = state.users[0]?.id || "";
    localStorage.setItem(USER_KEY, sessionUserId);
  }
}

function addActivity(taskId, text) {
  state.activities.unshift({
    id: uid("a"),
    userId: currentUser().id,
    taskId,
    text,
    createdAt: new Date().toISOString(),
  });
}

function addSystemActivity(text) {
  state.activities.unshift({
    id: uid("a"),
    userId: currentUser().id,
    taskId: null,
    text,
    createdAt: new Date().toISOString(),
  });
}

function nextTaskId() {
  const maxNumber = state.tasks.reduce((max, task) => {
    const number = Number(String(task.id).replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 180);
  return `PLN-${maxNumber + 1}`;
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-5)}`;
}

function randomColor() {
  const colors = ["#0f766e", "#2864a6", "#6d4cc2", "#9a6700", "#207a44", "#b42318"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function renderAvatar(user, extraClass = "") {
  return `<span class="avatar ${extraClass}" style="background:${escapeAttr(user.color || "#66707c")}">${escapeHtml(
    initials(user.name),
  )}</span>`;
}

function initials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isDueSoon(task) {
  if (!task.due) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${task.due}T00:00:00`));
  const diff = (due - today) / 86400000;
  return diff >= 0 && diff <= 3;
}

function isOverdue(task) {
  if (!task.due || task.status === "done") return false;
  return startOfDay(new Date(`${task.due}T00:00:00`)) < startOfDay(new Date());
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

async function loadState() {
  const localState = loadLocalState();

  if (!canUseApi()) {
    return localState;
  }

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (response.ok) {
      apiAvailable = true;
      const remoteState = normalizeWorkspaceState(await response.json());
      lastSavedPayload = JSON.stringify(stripSessionState(remoteState));
      localStorage.setItem(STORAGE_KEY, lastSavedPayload);
      return remoteState;
    }

    if (response.status === 404) {
      apiAvailable = true;
      return localState;
    }
  } catch {
    apiAvailable = false;
  }

  return localState;
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(seedState);
    const parsed = JSON.parse(raw);
    return normalizeWorkspaceState(parsed);
  } catch {
    return clone(seedState);
  }
}

function saveState() {
  const persistedState = stripSessionState(state);
  const payload = JSON.stringify(persistedState);
  localStorage.setItem(STORAGE_KEY, payload);

  if (shouldUseServerMutations() && payload !== lastSavedPayload) {
    lastSavedPayload = payload;
    void persistState(persistedState);
  }
}

async function resetWorkspace() {
  if (canUseApi() && !sessionToken) {
    openLoginModal(sessionUserId);
    return;
  }

  if (canUseApi() && !currentRole().canManageAccess) {
    showToast("Сбросить демо-данные может только администратор.");
    return;
  }

  if (shouldUseServerMutations()) {
    const nextState = await applyServerMutation("/api/state", {
      method: "PUT",
      body: stripSessionState(seedState),
    });
    if (!nextState) return;
  } else {
    state = clone(seedState);
    saveState();
  }

  activeTaskId = null;
  closeTaskDrawer();
  render();
  showToast("Демо-данные восстановлены.");
}

async function persistState(nextState) {
  try {
    const payload = JSON.stringify(stripSessionState(nextState));
    const headers = { "Content-Type": "application/json" };
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }

    const response = await fetch("/api/state", {
      method: "PUT",
      headers,
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }

    apiAvailable = true;
    lastSavedPayload = payload;
    updateSyncStatus();
    return true;
  } catch {
    apiAvailable = false;
    updateSyncStatus();
    return false;
  }
}

function startRemotePolling() {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  if (!canUseApi()) {
    return;
  }

  syncTimer = setInterval(refreshRemoteState, SERVER_POLL_MS);
}

async function refreshRemoteState() {
  if (!canUseApi() || !apiAvailable || !elements.taskModal.hidden || !elements.accessModal.hidden) {
    return;
  }

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const remoteState = normalizeWorkspaceState(await response.json());
    const remotePayload = JSON.stringify(stripSessionState(remoteState));
    if (remotePayload === lastSavedPayload) {
      return;
    }

    state = remoteState;
    lastSavedPayload = remotePayload;
    localStorage.setItem(STORAGE_KEY, remotePayload);
    ensureCurrentUser();
    render();
    if (activeTaskId) {
      renderTaskDetails();
    }
  } catch {
    apiAvailable = false;
    updateSyncStatus();
  }
}

async function restoreSession() {
  if (!canUseApi() || !sessionToken) {
    return;
  }

  try {
    const result = await apiRequest("/api/session");
    sessionUserId = result.user.id;
    localStorage.setItem(USER_KEY, sessionUserId);
  } catch {
    clearSession();
  }
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const requestOptions = {
    method: options.method || "GET",
    headers,
  };

  if (!options.skipAuth && sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestOptions);
  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuth) {
      clearSession();
      render();
      openLoginModal(sessionUserId);
    }

    const message = typeof payload === "string" ? payload : payload.error || "Request failed";
    throw new Error(message);
  }

  return payload;
}

async function applyServerMutation(path, options = {}) {
  if (!shouldUseServerMutations()) {
    openLoginModal(sessionUserId);
    return null;
  }

  try {
    const nextState = await apiRequest(path, options);
    state = normalizeWorkspaceState(nextState);
    lastSavedPayload = JSON.stringify(stripSessionState(state));
    localStorage.setItem(STORAGE_KEY, lastSavedPayload);
    ensureCurrentUser();
    render();
    if (activeTaskId) {
      renderTaskDetails();
    }
    return state;
  } catch (error) {
    showToast(error.message || "Не удалось сохранить изменение.");
    return null;
  }
}

function shouldUseServerMutations() {
  return canUseApi() && apiAvailable && Boolean(sessionToken);
}

function clearSession() {
  sessionToken = "";
  localStorage.removeItem(SESSION_KEY);
}

function canUseApi() {
  return window.location.protocol !== "file:";
}

function normalizeWorkspaceState(candidate) {
  if (!candidate || !Array.isArray(candidate.users) || !candidate.users.length || !Array.isArray(candidate.tasks)) {
    return clone(seedState);
  }

  const normalized = {
    ...clone(seedState),
    ...candidate,
    users: candidate.users,
    tasks: candidate.tasks.map((task) => ({
      commits: [],
      comments: [],
      assigneeIds: [],
      ...task,
      commits: Array.isArray(task.commits) ? task.commits : [],
      comments: Array.isArray(task.comments) ? task.comments : [],
      assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : [],
    })),
    activities: Array.isArray(candidate.activities) ? candidate.activities : [],
  };
  delete normalized.currentUserId;
  return normalized;
}

function stripSessionState(nextState) {
  const cleanState = clone(nextState);
  delete cleanState.currentUserId;
  return cleanState;
}

function updateSyncStatus() {
  if (!elements.syncStatus) return;

  const online = canUseApi() && apiAvailable;
  elements.syncStatus.textContent = online ? (sessionToken ? "Сервер" : "Нужен вход") : "Локально";
  elements.syncStatus.classList.toggle("online", online);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
