# LibraryOS

A full-stack library management system that allows patrons to browse books, manage reservations, and return books — while giving librarians a dashboard to manage users, books, and reservations.

🌐 **Live Site:** [https://library-project-k4u7.onrender.com](https://library-project-k4u7.onrender.com)

---

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Asgardeo (authentication)

**Backend**
- Node.js + Express
- Sequelize ORM
- PostgreSQL

---

## Project Structure

```
root/
├── frontend/   # React + TypeScript app
└── backend/    # Express + Sequelize API server
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Asgardeo account for authentication

---

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install express cors sequelize pg pg-hstore dotenv jose
```

3. Create a `.env` file in the `backend/` folder:
```env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=5432
DB_SCHEMA=public
PGSSLMODE=require
ASGARDEO_ORG=your_asgardeo_org_name
PORT=5001
```

4. Start the backend server:
```bash
node server.js
```

The backend will run on `http://localhost:5001`.

---

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend/` folder:
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_ASGARDEO_CLIENT_ID=your_asgardeo_client_id
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/your_org_name
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

---

## Features

### Patron
- Browse the full book catalog with availability status
- Check out available books
- View personal reservations with due dates and late status
- Return checked-out books

### Librarian
- Full librarian dashboard with access to all users, books, and reservations
- Add and edit books
- Add and edit users
- Mark reservations as returned or checked out
- Delete reservations

---

## Environment Variables

Make sure `.env` files are listed in `.gitignore` for both `frontend/` and `backend/` to avoid exposing secrets:

```
# In frontend/.gitignore and backend/.gitignore
.env
```

---

## Deployment

This project is deployed on [Render](https://render.com).

- The **backend** is deployed as a Web Service
- The **frontend** is deployed as a Static Site with build command `npm run build` and publish directory `dist`

When deploying, make sure to add your Render URLs to the **Allowed Origins** and **Authorized Redirect URLs** in your Asgardeo application settings.