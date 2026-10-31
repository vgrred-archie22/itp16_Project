# Modern To-Do Application (Node.js + MariaDB/MySQL)

A clean, modular, and responsive To-Do List application built with Express, MariaDB/MySQL, and modern vanilla JavaScript.

## 🌟 Features
- **Task Management**: Create, toggle status, inline edit titles, change priority, and delete tasks.
- **Priority Levels**: Support for `High`, `Medium`, and `Low` priority badges.
- **Filtering & Search**: Filter tasks by status (`All`, `Active`, `Completed`) and priority (`High`, `Medium`, `Low`), with real-time keyword search.
- **Dark Mode**: Toggleable light/dark themes with automatic system preference detection.
- **Modular Project Structure**: MVC-inspired organization with separate database config, controllers, routes, and public static assets.
- **Database Optimization**: Indexed table schema supporting timestamps (`created_at`, `updated_at`).

---

## 📁 Directory Structure

```text
itp16_Project/
├── config/
│   └── db.js                 # Database connection pool setup
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
├── .env.example              # Environment variables template
├── package.json              # Express & MariaDB dependencies
├── schema.sql                # Database schema with indexes & priorities
└── server.js                 # Application entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MariaDB** or **MySQL** server running

### 2. Database Setup
Run the SQL initialization script as a database administrator:
```bash
mariadb < schema.sql
# or for MySQL:
mysql -u root -p < schema.sql
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```
Example `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=todo_user
DB_PASSWORD=change_me
DB_NAME=todo_app
PORT=3000
```
If you use the XAMPP MySQL service configured on port `3307`, set `DB_PORT=3307` instead.

### 4. Install Dependencies & Start Server
```bash
npm install
npm start
```
The app will start at **http://localhost:3000**!

### Open in VS Code
Select **Launch Task Master** in **Run and Debug** and press **F5**. This starts the Express server and opens the app at `http://localhost:3000` once it is ready. Do not open `public/index.html` directly (`file://`), because the browser cannot reach the `/api/todos` endpoint from a file URL.

---

## 📡 REST API Endpoints

| Method   | Endpoint             | Description |
| :------- | :------------------- | :---------- |
| `GET`    | `/api/todos`         | Fetch todos (supports `?status=active`, `?priority=high`, `?search=term`) |
| `POST`   | `/api/todos`         | Create task (`{ "title": "Task name", "priority": "high" }`) |
| `PATCH`  | `/api/todos/:id`     | Update task (`{ "title": "...", "done": true, "priority": "low" }`) |
| `PUT`    | `/api/todos/:id`     | Alias for update task |
| `DELETE` | `/api/todos/:id`     | Delete single task by ID |
| `DELETE` | `/api/todos/completed` | Clear all completed tasks |
