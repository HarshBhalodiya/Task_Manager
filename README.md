# Task Manager Web Application

A full-stack Task Manager application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 📋 Project Structure

```
Task_Manager/
├── backend/              # Backend REST API
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   └── routes/       # API routes
│   ├── models/           # Mongoose models
│   ├── server.js         # Server entry point
│   ├── .env              # Environment variables
│   └── package.json      # Backend dependencies
│
├── frontend/             # Frontend UI
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styling
│   └── script.js         # JavaScript logic
│
└── README.md             # This file
```

## 🚀 Features

### Backend Features
- **RESTful API** with Express.js
- **MongoDB** integration with Mongoose
- **CRUD Operations** for tasks
- **Custom Middleware**:
  - Request logging
  - Content-Type validation
  - MongoDB ObjectId validation
- **Error Handling** with proper HTTP status codes
- **CORS** enabled for cross-origin requests

### Frontend Features
- **Responsive Design** - works on desktop and mobile
- **Add Tasks** with title and description
- **Edit Tasks** using modal dialog
- **Delete Tasks** with confirmation
- **Mark Complete** - toggle task completion status
- **Filter Tasks** - view All, Active, or Completed tasks
- **Real-time Updates** - immediate UI feedback
- **Clean UI** - modern, minimalist design

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (or use the existing one) with your MongoDB connection string:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Open `index.html` in your web browser, or use a local server:

**Option 1: Direct open**
- Simply double-click `index.html`

**Option 2: Using Python HTTP Server**
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`

**Option 3: Using Node.js http-server**
```bash
npx http-server -p 3000
```
Then visit `http://localhost:3000`

## 🔌 API Endpoints

### Base URL: `http://localhost:5000`

| Method | Endpoint       | Description           | Request Body                                    |
|--------|----------------|-----------------------|-------------------------------------------------|
| GET    | `/tasks`       | Get all tasks         | -                                               |
| GET    | `/tasks/:id`   | Get task by ID        | -                                               |
| POST   | `/tasks`       | Create new task       | `{ title, description?, completed? }`          |
| PUT    | `/tasks/:id`   | Update task           | `{ title?, description?, completed? }`         |
| DELETE | `/tasks/:id`   | Delete task           | -                                               |

### Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 📝 Task Schema

```javascript
{
  title: String (required),
  description: String (optional),
  completed: Boolean (default: false),
  createdAt: Date (default: Date.now)
}
```

## 🧪 Testing the Application

### Using the Frontend UI
1. Start the backend server
2. Open the frontend in a browser
3. Add, edit, delete, and complete tasks

### Using Postman/Thunder Client

**Get All Tasks:**
```
GET http://localhost:5000/tasks
```

**Create Task:**
```
POST http://localhost:5000/tasks
Content-Type: application/json

{
  "title": "Complete assignment",
  "description": "Finish the AWDF task manager project"
}
```

**Update Task:**
```
PUT http://localhost:5000/tasks/:id
Content-Type: application/json

{
  "completed": true
}
```

**Delete Task:**
```
DELETE http://localhost:5000/tasks/:id
```

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **Vanilla JavaScript** - Logic and API interaction
- **Fetch API** - HTTP requests

## 🎨 Features Breakdown

### Middleware Stack
1. **Logger** - Logs all incoming requests
2. **Content-Type Check** - Ensures POST/PUT use JSON
3. **JSON Parser** - Parses request body
4. **Routes** - Task endpoints
5. **404 Handler** - Catches undefined routes
6. **Error Handler** - Global error handling

### Error Handling
- **400** - Validation errors, malformed requests
- **404** - Resource not found
- **500** - Server errors

### Security Features
- Input validation
- MongoDB injection prevention
- XSS protection with HTML escaping
- Secure error messages (no stack traces exposed)

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB URI is correct in `.env`
- Ensure MongoDB Atlas allows connections from your IP
- Verify port 5000 is not already in use

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check CORS is enabled in backend
- Verify API_URL in `script.js` matches your backend URL

### Tasks not loading
- Open browser console (F12) to check for errors
- Verify backend is responding at `http://localhost:5000/tasks`
- Check network tab for failed requests

## 👨‍💻 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Making Changes
- Backend code: Edit files in `backend/src/`
- Frontend: Edit HTML, CSS, or JS files in `frontend/`
- Database models: Edit files in `backend/models/`

## ⚡ Performance Optimization (Practical 8)

The frontend uses route-based code splitting with `React.lazy()` + `Suspense` and a
300 ms minimum-delay fallback:

- `Login`, `Register` and `Dashboard` are lazy-loaded in `src/App.jsx`.
- `EditModal` is lazy-loaded inside the Dashboard (only fetched when the user clicks Edit).
- `TaskItem` is memoized and the task actions are wrapped in `useCallback` to avoid
  re-rendering every row when one task changes.

| Metric | Before | After |
|--------|--------|-------|
| Initial JS | 247.63 kB (82.71 kB gzip) | 238.22 kB (80.74 kB gzip) |
| Initial payload (JS + CSS) | 254.99 kB (84.62 kB gzip) | 245.92 kB (82.69 kB gzip) |

Full measurements, Profiler notes and reproduction steps: [`docs/PRACTICAL8_PERFORMANCE.md`](docs/PRACTICAL8_PERFORMANCE.md).

## 🗄️ In-Memory Caching (Practical 9)

`GET /tasks` is served from a `node-cache` instance with a 60-second TTL, and every write
(`POST`, `PUT`, `DELETE`) invalidates the affected keys so stale data is never returned.

- Cache module: `backend/src/cache/cache.js` (per-user keys `tasks:<userId>`, `task:<userId>:<id>`)
- Invalidation: after each successful write in `backend/src/controllers/taskController.js`
- Debug endpoint: `GET /cache/stats` (hits, misses, hit rate, live keys)
- Response header: `X-Cache: HIT | MISS | BYPASS`
- `CACHE_ENABLED=false` switches caching off for a fair before/after measurement

| Reading | Without cache | With cache |
|---------|---------------|------------|
| 1 | 94.46 ms | 5.38 ms |
| 2 | 79.12 ms | 3.59 ms |
| 3 | 76.12 ms | 3.07 ms |
| **Average** | **83.23 ms** | **4.01 ms** |

≈20.8× faster on repeated reads (95.2 % less time). Full write-up, invalidation proof and
reproduction steps: [`docs/PRACTICAL9_CACHING.md`](docs/PRACTICAL9_CACHING.md).

## 📄 License

MIT License - Feel free to use this project for educational purposes.

## 👤 Author

Created as part of AWDF (Advanced Web Development Framework) coursework.

## 🙏 Acknowledgments

- Built with Node.js and Express
- Database powered by MongoDB Atlas
- UI inspired by modern web design principles
