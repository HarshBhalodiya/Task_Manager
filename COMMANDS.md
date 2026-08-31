# Task Manager - Command Reference

## 🚀 Quick Start Commands

### Start Backend Server
```bash
cd backend
npm start
```
**Expected Output:**
```
MongoDB connected successfully
Task API listening on http://localhost:5000
```

### Start Frontend Server
```bash
cd frontend
npm start
```
**Expected Output:**
```
Starting up http-server
Available on:
  http://localhost:3000
```

---

## 📋 Complete Testing Guide

### Step 1: Start Backend (Terminal 1)
```bash
# Navigate to Task_Manager root directory
cd "D:\5 sem\AWDF\Task_Manager"

# Go to backend
cd backend

# Start the server
npm start
```

**✅ Success Signs:**
- See "MongoDB connected successfully"
- See "Task API listening on http://localhost:5000"
- No error messages

**❌ If it fails:**
- Check MongoDB Atlas IP whitelist
- Verify .env file has correct MONGO_URI
- Check if port 5000 is already in use

---

### Step 2: Start Frontend (Terminal 2 - New Terminal)
```bash
# Navigate to Task_Manager root directory
cd "D:\5 sem\AWDF\Task_Manager"

# Go to frontend
cd frontend

# Start the server
npm start
```

**✅ Success Signs:**
- Browser opens automatically at http://localhost:3000
- You see the Task Manager interface

**Alternative if npm start doesn't work:**
```bash
# Using Python
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000 -o
```

---

## 🧪 Testing the Application

### Test 1: Check Backend API Directly
```bash
# Test if backend is running (use Git Bash or PowerShell)
curl http://localhost:5000/tasks

# Or open in browser:
http://localhost:5000/tasks
```

**Expected Response:**
```json
{
  "success": true,
  "data": []
}
```

---

### Test 2: Frontend Connection
1. Open browser: http://localhost:3000
2. Try adding a task:
   - Enter title: "Test Task"
   - Enter description: "Testing the application"
   - Click "Add Task"
3. Check if task appears in the list below

---

### Test 3: Complete CRUD Operations

**CREATE (Add Task)**
1. Fill in the form at the top
2. Click "Add Task"
3. ✅ Task should appear in the list

**READ (View Tasks)**
1. All tasks display automatically
2. Try filters: "All Tasks", "Active", "Completed"

**UPDATE (Edit Task)**
1. Click "✏️ Edit" button on any task
2. Modify title or description
3. Check/uncheck "Mark as completed"
4. Click "Save Changes"
5. ✅ Task should update

**COMPLETE (Toggle)**
1. Click checkbox next to a task
2. ✅ Task should get strikethrough and fade

**DELETE (Remove Task)**
1. Click "🗑️ Delete" button
2. Confirm deletion
3. ✅ Task should disappear

---

## 🔍 API Testing with cURL (Alternative Testing)

### Get All Tasks
```bash
curl -X GET http://localhost:5000/tasks
```

### Create Task
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Sample Task\",\"description\":\"This is a test task\"}"
```

### Get Single Task (replace {id} with actual task ID)
```bash
curl -X GET http://localhost:5000/tasks/{id}
```

### Update Task (replace {id} with actual task ID)
```bash
curl -X PUT http://localhost:5000/tasks/{id} \
  -H "Content-Type: application/json" \
  -d "{\"completed\":true}"
```

### Delete Task (replace {id} with actual task ID)
```bash
curl -X DELETE http://localhost:5000/tasks/{id}
```

---

## 🛠️ Troubleshooting Commands

### Check if ports are in use
```bash
# Windows PowerShell
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Git Bash
netstat -ano | grep :5000
netstat -ano | grep :3000
```

### Kill process on port (if needed)
```bash
# Windows PowerShell (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Check Backend Logs
```bash
cd backend
npm start
# Watch console for errors
```

### Check Node.js and npm versions
```bash
node --version
npm --version
```

### Reinstall dependencies (if needed)
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend (if using npm packages)
cd frontend
npm install
```

---

## 📊 Expected File Structure After Setup

```
Task_Manager/
├── backend/
│   ├── node_modules/      ✅ After npm install
│   ├── src/
│   ├── models/
│   ├── server.js
│   ├── .env               ✅ Must exist with MONGO_URI
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── package.json       ✅ For running local server
│
├── README.md
└── COMMANDS.md            ✅ This file
```

---

## 🎯 Quick Testing Checklist

- [ ] Backend starts without errors (port 5000)
- [ ] Frontend opens in browser (port 3000)
- [ ] Can add a new task
- [ ] Task appears in the list
- [ ] Can edit a task
- [ ] Can mark task as complete
- [ ] Can filter tasks (All/Active/Completed)
- [ ] Can delete a task
- [ ] No console errors in browser (F12)
- [ ] Backend logs requests in terminal

---

## 🌐 URLs to Access

- **Frontend UI:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Get All Tasks:** http://localhost:5000/tasks
- **API Documentation:** See main README.md

---

## 💡 Tips

1. **Keep both terminals open** while testing
2. **Check browser console** (F12) for frontend errors
3. **Check terminal** for backend errors
4. **Use Postman** or Thunder Client for advanced API testing
5. **CORS errors?** Make sure backend has CORS enabled (already configured)

---

## 🚪 Stopping the Servers

### Stop Backend
- Press `Ctrl + C` in the backend terminal

### Stop Frontend
- Press `Ctrl + C` in the frontend terminal
- Or close the terminal window

---

## 📝 Notes

- Backend must be running for frontend to work
- Frontend will show connection errors if backend is not running
- Check MongoDB Atlas if you see database connection errors
- Clear browser cache if you don't see updates: `Ctrl + Shift + R`
