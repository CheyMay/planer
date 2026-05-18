# Planum

Локальный MVP командного планера по типу Jira.

## Запуск

```powershell
node server.js
```

После запуска откройте http://localhost:4173.

Если порт занят:

```powershell
$env:PORT=4174; node server.js
```

Приложение можно открыть и напрямую через `index.html`, но тогда данные будут храниться только в `localStorage` текущего браузера. Через `server.js` задачи, пользователи, коммиты и активность сохраняются в общем файле `data/workspace.json`.

## Запуск на сервере

PM2:

```bash
cd /root/planer/planer
git pull
pm2 delete planer || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

По умолчанию `ecosystem.config.cjs` запускает приложение на `127.0.0.1:4174`. Если порт занят, поменяйте `PORT` в `ecosystem.config.cjs` и в nginx-конфиге ниже.

Nginx для `planer.code9dev.ru`:

```nginx
server {
    listen 80;
    server_name planer.code9dev.ru;

    location / {
        proxy_pass http://127.0.0.1:4174;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Применить nginx:

```bash
sudo nano /etc/nginx/sites-available/planer.code9dev.ru
sudo ln -s /etc/nginx/sites-available/planer.code9dev.ru /etc/nginx/sites-enabled/planer.code9dev.ru
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS через certbot:

```bash
sudo certbot --nginx -d planer.code9dev.ru
```

Если PM2 пишет `EADDRINUSE`, значит порт уже занят. Проверка:

```bash
sudo ss -ltnp | grep ':4174'
pm2 logs planer --lines 50
```

## Бэкапы

Перед каждым сохранением сервер делает копию текущего `data/workspace.json` в `data/backups/`. По умолчанию хранится 30 последних копий. Лимит можно изменить при запуске:

```powershell
$env:MAX_BACKUPS=100; node server.js
```

Чтобы вручную восстановиться из последнего бэкапа, остановите сервер и выполните:

```powershell
$backup = Get-ChildItem data\backups -Filter *.workspace.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Copy-Item $backup.FullName data\workspace.json -Force
```

## Вход

В серверном режиме нужен вход по пользователю и PIN. У демо-пользователей PIN по умолчанию:

```text
1111
```

Администратор может добавлять новых пользователей в окне `Доступы` и задавать им PIN.

## Что есть

- роли: администратор, менеджер, разработчик, наблюдатель;
- локальный выбор пользователя без влияния на остальных участников;
- создание и редактирование задач;
- канбан-доска со статусами и drag-and-drop;
- карточка задачи с постановщиком, исполнителями, сроком, веткой и оценкой;
- комментарии и привязка коммитов;
- фильтры по статусу, исполнителю и области;
- лента активности;
- управление пользователями и ролями для администратора;
- API `GET /api/state` и `PUT /api/state` для общего JSON-хранилища.

## API

- `POST /api/login` - вход по пользователю и PIN;
- `GET /api/session` - проверка текущей сессии;
- `POST /api/tasks` - создание задачи;
- `PATCH /api/tasks/:id` - редактирование задачи;
- `PATCH /api/tasks/:id/status` - смена статуса;
- `POST /api/tasks/:id/comments` - комментарий;
- `POST /api/tasks/:id/commits` - коммит;
- `DELETE /api/tasks/:id` - удаление задачи;
- `POST /api/users` - добавление пользователя;
- `PATCH /api/users/:id` - изменение роли/PIN;
- `DELETE /api/users/:id` - удаление пользователя.
