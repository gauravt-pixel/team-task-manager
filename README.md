# ⚡ TaskFlow — Team Task Manager

A full-stack team project & task management web app with role-based access control.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose + bcrypt) |
| Frontend | React + Vite |
| Routing | React Router v6 |
| HTTP | Axios |
| Deployment | Railway |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── main.py               # FastAPI app entry
│   ├── requirements.txt
│   ├── railway.toml
│   ├── Procfile
│   └── app/
│       ├── config.py         # Settings / env vars
│       ├── database.py       # SQLAlchemy engine
│       ├── models.py         # DB models
│       ├── schemas.py        # Pydantic schemas
│       ├── auth.py           # JWT + password utils
│       └── routers/
│           ├── auth.py       # /api/auth
│           ├── users.py      # /api/users
│           ├── projects.py   # /api/projects
│           ├── tasks.py      # /api/tasks
│           └── dashboard.py  # /api/dashboard
└── frontend/
    ├── src/
    │   ├── api/client.js     # Axios API calls
    │   ├── context/          # Auth context
    │   ├── components/       # Layout, Sidebar
    │   └── pages/            # Dashboard, Projects, Tasks
    └── vite.config.js
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your DATABASE_URL and a strong SECRET_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

App runs at: `http://localhost:3000`

---

## 🌐 Deploy on Railway (Step-by-Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

### 2. Deploy Backend
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → Set **Root Directory** to `backend`
3. Add a **PostgreSQL** plugin from Railway dashboard
4. Set these environment variables:
   ```
   DATABASE_URL=<auto-filled by Railway PostgreSQL plugin>
   SECRET_KEY=your-random-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ```
5. Railway auto-detects `railway.toml` and deploys

### 3. Deploy Frontend
1. In same Railway project → Add Service → GitHub Repo
2. Set **Root Directory** to `frontend`
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-railway-url.up.railway.app
   ```
4. Set **Build Command**: `npm run build`
5. Set **Start Command**: `npx serve dist -p $PORT`

---

## 🔑 Features

### Authentication
- Signup / Login with JWT tokens
- 7-day session persistence
- Protected routes

### Projects
- Create projects with name, description, color, due date
- View all your projects with progress bars
- Delete projects (Admin only)

### Team Management
- Add members by email
- Role-based access: **Admin** / **Member**
- Admins can change member roles or remove them

### Tasks
- Create tasks with title, description, status, priority, assignee, due date, tags
- **List view** and **Kanban board view**
- Filter by status
- Inline status change
- Members can edit their own tasks; Admins can edit all

### Dashboard
- Stats: total projects, active, assigned to me, in progress, completed, overdue
- Overall completion rate with progress bar
- Recent activity table with live due-date indicators

---

## 🔐 Role Permissions

| Action | Admin | Member |
|---|---|---|
| View project | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Edit own tasks | ✅ | ✅ |
| Edit all tasks | ✅ | ❌ |
| Delete own tasks | ✅ | ✅ |
| Delete any task | ✅ | ❌ |
| Add members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change roles | ✅ | ❌ |
| Delete project | ✅ | ❌ |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| PATCH | /api/projects/:id/members/:mid | Update role |
| DELETE | /api/projects/:id/members/:mid | Remove member |
| GET | /api/tasks/projects/:id/tasks | List tasks |
| POST | /api/tasks/projects/:id/tasks | Create task |
| PATCH | /api/tasks/projects/:id/tasks/:tid | Update task |
| DELETE | /api/tasks/projects/:id/tasks/:tid | Delete task |
| GET | /api/tasks/my-tasks | My assigned tasks |
| GET | /api/dashboard/stats | Dashboard stats |
| GET | /api/dashboard/recent-tasks | Recent tasks |

Full interactive docs: `GET /docs`

---

## 🎨 Design

- Dark theme (Catppuccin Mocha palette)
- Fully responsive layout
- Kanban board + list view for tasks
- Color-coded priorities and statuses
- Real-time due date indicators (overdue/soon/ok)
