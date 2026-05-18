const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const workspaceFile = path.join(dataDir, "workspace.json");
const exampleFile = path.join(dataDir, "workspace.example.json");
const backupDir = path.join(dataDir, "backups");

const users = [
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
];

fs.mkdirSync(dataDir, { recursive: true });

const sourceFile = fs.existsSync(workspaceFile) ? workspaceFile : exampleFile;
const workspace = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const existingUsers = Array.isArray(workspace.users) ? workspace.users : [];
const userById = new Map(existingUsers.map((user) => [user.id, user]));

workspace.users = users.map((user) => ({
  ...userById.get(user.id),
  ...user,
}));

if (fs.existsSync(workspaceFile)) {
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(workspaceFile, path.join(backupDir, `${timestamp}-before-set-users.workspace.json`));
}

fs.writeFileSync(workspaceFile, `${JSON.stringify(workspace, null, 2)}\n`, "utf8");

console.log("Users updated:");
for (const user of users) {
  console.log(`${user.name}: ${user.pin}`);
}
