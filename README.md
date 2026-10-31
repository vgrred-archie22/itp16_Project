# Modern To-Do Application (Node.js + SQLite)

A clean, modular, and responsive To-Do List application built with Express, SQLite, and modern vanilla JavaScript.

## Features
- **Task Management**: Create, toggle status, inline edit titles, change priority, and delete tasks.
- **Priority Levels**: Support for `High`, `Medium`, and `Low` priority badges.
- **Filtering & Search**: Filter tasks by status (`All`, `Active`, `Completed`) and priority (`High`, `Medium`, `Low`), with real-time keyword search.
- **Dark Mode**: Toggleable light/dark themes with automatic system preference detection.
- **Modular Project Structure**: MVC-inspired organization with separate database config, controllers, routes, and public static assets.
- **Database Optimization**: Indexed table schema supporting timestamps (`created_at`, `updated_at`).

---

## Directory Structure

```text
itp16_Project/
├── config/
│   └── db.js                 # SQLite initialization
├── controllers/
│   └── todoController.js     # Request validation & DB logic
├── routes/
│   └── todoRoutes.js         # API endpoints
├── public/
│   ├── css/
│   │   └── style.css         # Modern design tokens & styles
│   ├── js/
│   │   └── app.js            # Frontend API client & interactive UI
│   └── index.html            # Main HTML interface
├── .env.example              # Optional database path and port
├── package.json              # Express dependencies
├── schema.sql                # SQLite schema with indexes
└── server.js                 # Application entry point
```

## Getting Started

### 1. Prerequisites
- **Node.js**: v22.13.0 or higher

No separate database server is needed. The app creates `data/todos.sqlite` and its tables automatically the first time it starts.

### User accounts and task privacy

Users can register with a username (3–32 letters, numbers, or underscores) and a password (12–128 characters). Each account can only view and change its own tasks. The first account created claims any existing tasks that do not yet have an owner; later accounts start with an empty list. Database schema changes are applied automatically on startup.

Registration is open to anyone who can reach the app, and there is no password-reset or email-verification flow. Use HTTPS before entering real passwords or exposing the app publicly. In production, set `NODE_ENV=production` so session cookies are marked Secure; serve the app over HTTPS for those cookies to work.

### 2. Optional Configuration
Copy `.env.example` to `.env` to change the database file location or server port:
```bash
cp .env.example .env
```
Example `.env`:
```env
SQLITE_DB_PATH=./data/todos.sqlite
PORT=3000
```

### 3. Install Dependencies & Start Server
```bash
npm install
npm start
```
The app will start at **http://localhost:3000**. Its startup message prints the path to the SQLite database file.

### Open in VS Code
Select **Launch Task Master** in **Run and Debug** and press **F5**. This starts the Express server and opens the app at `http://localhost:3000` once it is ready. Do not open `public/index.html` directly (`file://`), because the browser cannot reach the `/api/todos` endpoint from a file URL.

### Access the Database
The database is the file `data/todos.sqlite` in the project folder. To view or edit it, open that file with a SQLite database viewer such as **DB Browser for SQLite**. You can also use a SQLite extension in VS Code. Stop the app before manually editing or copying the database file. The database is local and is ignored by Git.

The old MariaDB/MySQL database is not automatically copied into SQLite.

## REST API Endpoints

| Method   | Endpoint             | Description |
| :------- | :------------------- | :---------- |
| `GET`    | `/api/todos`         | Fetch todos (supports `?status=active`, `?priority=high`, `?search=term`) |
| `POST`   | `/api/todos`         | Create task (`{ "title": "Task name", "priority": "high" }`) |
| `PATCH`  | `/api/todos/:id`     | Update task (`{ "title": "...", "done": true, "priority": "low" }`) |
| `PUT`    | `/api/todos/:id`     | Alias for update task |
| `DELETE` | `/api/todos/:id`     | Delete single task by ID |
| `DELETE` | `/api/todos/completed` | Clear all completed tasks |
