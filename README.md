# To-do list (Node.js + MariaDB)

## Setup
1. Install Node.js 18+ and MariaDB.
2. Create the database, user and table:
   `sudo mariadb < schema.sql`   (edit the password in schema.sql first)
3. Copy `.env.example` to `.env` and set the same credentials.
4. `npm install`
5. `npm start`, then open http://localhost:3000

## API
- GET    /api/todos
- POST   /api/todos            { "title": "..." }
- PATCH  /api/todos/:id        { "done": true }
- DELETE /api/todos/:id
- DELETE /api/todos/completed
