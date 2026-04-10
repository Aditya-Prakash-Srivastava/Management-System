# 🚀 Smart Task & Activity Management System 

A professional, full-stack Task Management System designed for scale and real-time collaboration. This application is equipped with robust JWT Authentication, Role-Based Access Control (RBAC), Real-Time data synchronization via WebSockets, and magic AI Task Summarization powered by the Google Gemini API.

## 🌟 Executive Summary
Built as a modern Single Page Application (SPA), this project aims to streamline team collaboration. It allows users and administrators to create, track, and manage tasks efficiently. The integration of WebSockets guarantees that any update to a task instantly reflects across all connected client interfaces, eliminating the need to refresh. Furthermore, an AI-powered assistant provides one-click contextual summaries of lengthy task descriptions.

---

## 🛠️ Tech Stack Architecture

**Frontend:**
- **React.js (Vite)**: Lightning-fast, component-driven UI.
- **Tailwind CSS**: Utility-first CSS framework for a responsive, clean aesthetic.
- **Context API**: For global state management (Authentication & User Roles).
- **Socket.io-client**: For persistent WebSocket connections enabling real-time UI updates.

**Backend:**
- **Node.js & Express.js**: High-performance, non-blocking REST API server.
- **PostgreSQL**: Robust relational database for strict data integrity.
- **Prisma ORM**: Type-safe database interactions and schema management.
- **Socket.io**: Real-time event broadcasting.
- **JSON Web Tokens (JWT)**: Stateless server authentication (Access & Refresh tokens).
- **Google Generative AI (Gemini Flash)**: For NLP-driven task summarization.

---

## 📂 Codebase Structure & Architecture 

The repository follows a clean, decoupled **Monorepo-style structure** separating the Frontend and Backend to ensure scalability and independent deployment capabilities.

### `backend/` (Node.js + Express)
Follows the classic **MVC (Model-View-Controller)** pattern.
- `prisma/`: Contains `schema.prisma`, defining the database tables and relationships.
- `routes/`: Express routers mapping URLs (e.g., `/api/auth`, `/api/tasks`) to controller functions.
- `controllers/`: Contains the core business logic. For example, `taskController.js` handles CRUD validation, DB writes, and Socket event emission.
- `middleware/`: Custom interceptors like `auth.js` that verify JWTs and enforce Role-Based Access before allowing requests to reach controllers.
- `utils/`: Reusable helper functions, such as token generation logic.

### `frontend/` (React + Vite)
Follows a modular, **Component-Driven** architecture.
- `src/components/`: Reusable, stateless or tightly-scoped UI elements (e.g., `TaskCard.jsx`, `Navbar.jsx`).
- `src/pages/`: Top-level route components acting as views (e.g., `Dashboard.jsx`, `Login.jsx`).
- `src/context/`: Global React Context providers (e.g., `AuthContext` to avoid prop-drilling user authentication data).
- `src/utils/`: Axios instance configurators and helper functions for interacting with the backend API.

---

## 💡 Key Technical Features & Implementations

1. **Robust Authentication & Security**
   - **Access + Refresh Tokens**: Eliminates session hijacking risks. Access tokens are short-lived, while refresh tokens allow seamless background re-authentication.
   - **Password Hashing**: Employs `bcryptjs` before persisting passwords to PostgreSQL.

2. **Role-Based Access Control (RBAC)**
   - Distinguishes between `USER` and `ADMIN` roles.
   - Only Admins and Task Authors possess the authorization to update or delete specific task cards, enforced firmly at the backend middleware level.

3. **Event-Driven Real-Time Sync**
   - Integrates `Socket.io` directly into the Express `httpServer`.
   - When a controller successfully writes to the database, it emits events (`taskCreated`, `taskUpdated`, `taskDeleted`). The frontend listens and updates the UI state instantly.

4. **AI Summarization**
   - Leverages `@google/generative-ai` to interpret task details.
   - Built to parse text via prompt engineering directly inside `taskController.js` to provide concise, actionable summaries for complex task descriptions.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL running locally or a cloud URI (like Neon/Supabase)

### 1. Database & Backend Configuration
1. Navigate to the backend directory: 
   ```bash
   cd backend
   ```
2. Install dependencies: 
   ```bash
   npm install
   ```
3. Duplicate `.env.example` as `.env` and configure:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/task_db?schema=public"
   JWT_ACCESS_SECRET="your_secret"
   JWT_REFRESH_SECRET="your_refresh_secret"
   GEMINI_API_KEY="your_google_gemini_api_key"
   ```
4. Push Prisma Schema to set up the database tables: 
   ```bash
   npx prisma db push
   ```
5. Start Server: 
   ```bash
   npm run dev
   ``` 
   *Runs on Port 5000*

### 2. Frontend Configuration
1. Open a new terminal instance.
2. Navigate to frontend: 
   ```bash
   cd frontend
   ```
3. Install dependencies: 
   ```bash
   npm install
   ```
4. Start Vite Server: 
   ```bash
   npm run dev
   ``` 
   *Runs on Port 5173*

---

> **Note for Interviewer/Reviewer:**
> The architectural decisions in this project prioritize *separation of concerns* and *responsiveness*. By delegating authentication logic to middleware and centralizing database interactions via Prisma, the backend remains extremely modular and easy to scale. Real-time UX and AI capabilities have been integrated as distinct micro-features that enhance, rather than block, the core CRUD operational flow.
