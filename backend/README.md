# Task Manager - Backend API

REST API for the Task Manager application built with Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

3. Start the server:
```bash
npm start
```

## API Endpoints

- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get task by ID
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## Technologies

- Node.js
- Express.js
- MongoDB + Mongoose
- CORS
- dotenv
