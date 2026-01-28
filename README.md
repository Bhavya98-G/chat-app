# Full Stack Real-Time Chat Application

A modern, full-stack real-time chat application built with **FastAPI**, **React**, and **MySQL**. It features seamless messaging, user authentication, and a responsive UI.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using WebSockets.
- **User Authentication**: Secure login and registration.
- **Responsive Design**: Beautiful interface tailored for desktop and mobile.
- **Chat History**: Persistent chat history stored in MySQL.
- **Status Indicators**: Real-time online/offline status and typing indicators.
- **Dockerized**: Fully containerized for easy deployment.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Modern CSS3)
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Development Method**: Built with the help of AI through **Vibe Coding**

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy (Async)
- **Database Driver**: aiomysql
- **Real-time**: WebSockets
- **Package Manager**: uv

### Database
- **MySQL 8.0**

### Infrastructure
- **Docker** & **Docker Compose**

---

## 📋 Prerequisites

- **Docker Desktop** installed and running.
- **Git** (optional, to clone the repo).

---

## 🏃‍♂️ How to Run

The easiest way to run the application is using Docker Compose.

### 1. Clone/Open the Project
Navigate to the project directory in your terminal.

```bash
cd "path/to/chat app"
```

### 2. Environment Configuration
Ensure you have the necessary `.env` files.
- **Backend**: `backend/.env` should contain:
  ```env
  SECRET_KEY=your-secret-key
  groq_api_key=your_groq_key  # If applicable
  DATABASE_URL=mysql+aiomysql://dev_user:dev_password@db:3306/chat_app
  ```

### 3. Start the Application
Run the following command to build and start the containers:

```bash
docker compose up -d --build
```

This will start three services:
- **db**: MySQL database (Port 3311 locally, 3306 internal)
- **backend**: FastAPI server (Port 8000)
- **frontend**: React application (Port 5173)

### 4. Access the App
- **Frontend (App)**: [http://localhost:5173](http://localhost:5173)
- **Backend (API Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)

> **Note**: If you are logging in for the first time after a database reset, please **Register** a new account.

---

## 🔧 Local Development (Without Docker)

If you prefer to run services locally:

### Backend
1. Navigate to `backend/`.
2. Install dependencies: `uv sync`
3. Run server: `uv run uvicorn main:app --reload`

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

---

## 📁 Project Structure

```
chat app/
├── backend/            # FastAPI Backend
│   ├── app/            # Application logic (routers, etc.)
│   ├── core/           # Core config (database, etc.)
│   ├── models/         # Database models
│   ├── Dockerfile      # Backend Dockerfile
│   └── main.py         # Entry point
├── frontend/           # React Frontend
│   ├── src/            # Source code
│   │   ├── features/   # Feature-based components (Chat, Auth, etc.)
│   │   └── ...
│   └── Dockerfile      # Frontend Dockerfile
├── docker-compose.yml  # Docker Composition
└── README.md           # Project Documentation
```
