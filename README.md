# Team Task Manager

## Overview
Team Task Manager is a full-stack demo that combines authentication, project organization, and task tracking with a modern glass UI. The frontend is a single-page experience that talks to the Node/Express API via Fetch and updates the dashboard in real time.

## Features
- Authentication (signup and login) with JWT stored in localStorage
- Project management panel (stored locally for demo purposes)
- Task creation with assignee and status
- Live dashboard counts (total, completed, pending)
- Client-side search and status badges
- Inline success/error notices

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT
- Frontend: HTML, CSS, JavaScript

## Project Structure
```
team-task-manager/
├── server.js
├── package.json
├── .env
└── frontend/
    ├── index.html
    ├── app.js
    └── assets/
        └── group-discussion.jpg
```

## Setup
1. Install dependencies:
   ```
   npm install
   ```

2. Create an `.env` file with your database connection string:
   ```
   MONGO_URI=your_mongodb_connection_string
   ```

3. Add the background image to:
   ```
   frontend/assets/group-discussion.jpg
   ```

4. Start the server:
   ```
   node server.js
   ```

5. Open the app:
   ```
   http://localhost:5000
   ```

## Deployment
Live demo:
https://team-task-manager-git-main-jahnavi0057s-projects.vercel.app

## How To Use
1. **Sign up or log in** using the Authentication card. The JWT token is stored in localStorage under `token`.
2. **Create projects** in the Project Management card. Projects are stored locally in localStorage to keep the demo simple.
3. **Create tasks** in the Task Management card by entering a title, assignee email, and status. The task is sent to `POST /tasks` with the JWT in the `Authorization` header.
4. **View tasks** and status badges in the task list. Tasks are scoped by `assignedTo` (the current logged-in email).
5. **Check the dashboard** to see total, completed, and pending counts based on the latest task list.
6. **Search tasks** using the crystal-glass search bar to filter by title or assignee.

## API Endpoints
### Authentication
- `POST /signup` -> Create a user
- `POST /login` -> Login and get token

### Tasks
- `POST /tasks` -> Create a task (requires JWT)
- `GET /tasks` -> Get tasks assigned to the logged-in user (requires JWT)

## Notes
- Projects are stored on the client only. Add backend endpoints if you want full persistence.
- The background image is rendered at 50% opacity for readability.

## License
Demo project for learning purposes.
