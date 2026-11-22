# Joineazy — Student, Group & Assignment Management System

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A full-stack, role-based web application developed for **Joineazy**. The system enables students to form collaborative groups, manage team members, access professor-provided OneDrive assignment submission links, and confirm assignment submissions via a strict **two-step verification workflow** with visual progress tracking. Professors (Admins) can publish and manage assignments targeted either cohort-wide or to specific groups, track submissions across group-wise and student-wise matrices, and analyze cohort completion rates via an interactive analytics dashboard.

---

## Table of Contents
1. [Overview of Implementation](#overview-of-implementation)
2. [Key Features & Role-Based Workflows](#key-features--role-based-workflows)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema & ER Diagram](#database-schema--er-diagram)
5. [API Endpoint Reference](#api-endpoint-reference)
6. [Quick Demo Credentials](#quick-demo-credentials)
7. [Setup & Run Instructions](#setup--run-instructions)
   - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
   - [Method 2: Local Development (Standalone / Postgres)](#method-2-local-development-standalone--postgres)
8. [Key Design & Deployment Decisions](#key-design--deployment-decisions)

---

## Overview of Implementation

- **Frontend**: Single-Page Application (SPA) built with **React 19**, **Vite**, **Tailwind CSS v4**, **React Router DOM**, **Recharts** (data visualization), and **Lucide Icons**. Includes responsive layouts, interactive progress bars, achievement badges, and celebratory confetti animations upon submission.
- **Backend**: Modular RESTful API built with **Node.js** and **Express.js**. Features JWT authentication, role-based authorization middleware, parameterized SQL query sanitation, and validation using `express-validator`.
- **Database**: **PostgreSQL 16** with relational schema enforcing foreign keys, cascading deletions, unique constraints, and indices. The backend includes a dual-engine adapter: connects to native PostgreSQL when running in Docker or local environment, with automated zero-configuration in-memory PostgreSQL engine fallback for immediate local evaluation without external dependencies.
- **Containerization**: Multi-stage **Dockerfiles** for both frontend (Nginx reverse proxy) and backend, orchestrated by **Docker Compose** including a dedicated PostgreSQL container with health checks.

---

## Key Features & Role-Based Workflows

### 1. Student Role
- **Authentication**: Register with Name, Email, Password, Student ID number, and Department.
- **Group Creation & Management**:
  - Create student groups with unique, auto-generated alphanumeric Join Codes (e.g., `ALPHA-88`).
  - Automatically designated as **Group Leader**.
  - Invite and add members via Student Email or Student ID with autocomplete search.
  - Join existing teams instantly by entering their Join Code.
- **Assignment & OneDrive Access**:
  - View all assignments posted by professors (filtered to cohort-wide or specifically assigned to their group).
  - One-click access to the professor's external **OneDrive Submission Folder**.
- **Two-Step Verification Submission**:
  - **Step 1**: Review assignment details, access OneDrive link, input optional submission description and direct file URL, and select the submitting group.
  - **Step 2**: Mandatory confirmation checklist verifying upload, followed by explicit **"Yes, I have submitted"** verification before locking the receipt.
- **Visual Progress Tracking**:
  - Dynamic completion progress bars reflecting group submission percentage.
  - Performance badges: `All Completed`, `Top Performer`, `On Track`, and `Pending Work`.

### 2. Admin (Professor) Role
- **Assignment Publishing & Targeting**:
  - Create, edit, and delete assignments with title, description, due date, and OneDrive folder links.
  - Granular targeting: assign work to **All Students** or select **Specific Groups**.
- **Unified Submission Tracking**:
  - **Group-Wise Matrix**: Collapsible view showing every group, member list, and status across all assignments (`CONFIRMED`, `PENDING`, `OVERDUE`), along with confirming student name, timestamp, and notes.
  - **Student-Wise Matrix**: Searchable roster of all enrolled students, their affiliated groups, total assignments assigned, confirmed count, and progress rate.
- **Interactive Analytics Dashboard**:
  - Real-time KPI summary counts (Total Students, Groups, Active Tasks, Overall Submission Completion Rate).
  - Recharts Visualizations: Group Performance Comparison (Bar Chart) and Submission Status Distribution (Donut Chart).
  - Recent Submissions Live Feed with audit timestamps.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Tailwind CSS)"]
        UI["Responsive UI (Vite SPA)"]
        Router["React Router DOM"]
        AuthCtx["Auth Context (JWT Storage)"]
        APIClient["Axios HTTP Client with Interceptors"]
    end

    subgraph ReverseProxy["Nginx Web Server (Docker)"]
        StaticServe["Serves Static Assets (Port 3000)"]
        ProxyPass["Reverse Proxy /api/* -> Backend:5000"]
    end

    subgraph Server["Backend Server (Node.js + Express)"]
        AuthMid["Auth & Role Middleware (JWT Verify)"]
        Controllers["Controllers (Auth, Groups, Assignments, Submissions, Analytics)"]
        DBLayer["PostgreSQL Connection Layer (pg.Pool / Fallback)"]
    end

    subgraph Database["Database (PostgreSQL 16)"]
        PG["PostgreSQL Relational DB (Port 5432)"]
        Tables["Tables: users, groups, group_members, assignments, assignment_target_groups, submissions"]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> APIClient
    APIClient --> ReverseProxy
    StaticServe --> UI
    ProxyPass --> Server
    Server --> AuthMid
    AuthMid --> Controllers
    Controllers --> DBLayer
    DBLayer --> Database
```

---

## Database Schema & ER Diagram

```mermaid
erDiagram
    USERS ||--o{ GROUPS : "creates"
    USERS ||--o{ GROUP_MEMBERS : "belongs to"
    GROUPS ||--|{ GROUP_MEMBERS : "contains"
    USERS ||--o{ ASSIGNMENTS : "posts (professor)"
    ASSIGNMENTS ||--o{ ASSIGNMENT_TARGET_GROUPS : "targets"
    GROUPS ||--o{ ASSIGNMENT_TARGET_GROUPS : "assigned to"
    GROUPS ||--o{ SUBMISSIONS : "submits"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"
    USERS ||--o{ SUBMISSIONS : "confirmed by"

    USERS {
        varchar id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role "student | admin"
        varchar student_id
        varchar department
        timestamp created_at
    }

    GROUPS {
        varchar id PK
        varchar name
        text description
        varchar join_code UK
        varchar created_by FK
        timestamp created_at
        timestamp updated_at
    }

    GROUP_MEMBERS {
        varchar id PK
        varchar group_id FK
        varchar user_id FK
        varchar role_in_group "leader | member"
        timestamp joined_at
    }

    ASSIGNMENTS {
        varchar id PK
        varchar title
        text description
        timestamp due_date
        text onedrive_link
        varchar target_type "ALL | SPECIFIC_GROUPS"
        varchar status "ACTIVE | ARCHIVED"
        varchar created_by FK
        timestamp created_at
    }

    ASSIGNMENT_TARGET_GROUPS {
        varchar id PK
        varchar assignment_id FK
        varchar group_id FK
    }

    SUBMISSIONS {
        varchar id PK
        varchar assignment_id FK
        varchar group_id FK
        varchar submitted_by_user_id FK
        varchar status "CONFIRMED | PENDING"
        text submission_notes
        text onedrive_item_url
        timestamp confirmed_at
    }
```

---

## API Endpoint Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new student or admin account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and group memberships |
| `GET` | `/api/auth/students` | Authenticated | Searchable list of students for group invitations |

### Groups (`/api/groups`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/groups` | Authenticated | List groups (Students: their groups; Admin: all groups) |
| `GET` | `/api/groups/:id` | Authenticated | Get single group with members, tasks, and progress metrics |
| `POST` | `/api/groups` | Student | Create a new group (creator becomes Leader) |
| `POST` | `/api/groups/:id/members` | Leader / Admin | Add/invite member by email or Student ID |
| `DELETE` | `/api/groups/:id/members/:userId` | Leader / Admin | Remove member from group |
| `POST` | `/api/groups/join` | Student | Join a group using an alphanumeric Join Code |

### Assignments (`/api/assignments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Authenticated | List assignments (filtered to user's targeted groups) |
| `GET` | `/api/assignments/:id` | Authenticated | Get assignment details with target groups and submissions |
| `POST` | `/api/assignments` | Admin (Professor) | Create new assignment (targets ALL or specific groups) |
| `PUT` | `/api/assignments/:id` | Admin (Professor) | Update assignment metadata, due dates, or OneDrive links |
| `DELETE` | `/api/assignments/:id` | Admin (Professor) | Delete assignment and associated submission records |

### Submissions (`/api/submissions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/submissions/confirm` | Student | Execute **two-step verification** submission confirmation |
| `DELETE` | `/api/submissions/:assignmentId/:groupId` | Student / Admin | Undo/reset submission confirmation |
| `GET` | `/api/submissions/tracking` | Admin (Professor) | Unified group-wise and student-wise tracking matrix |

### Analytics (`/api/analytics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Admin (Professor) | Real-time KPIs, group performance charts & status distribution |

---

## Quick Demo Credentials

The database is pre-seeded with realistic data so you can test both roles immediately without manual setup:

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Professor (Admin)** | Prof. Dr. Alan Vance | `prof@joineazy.edu` | `Admin@123` | Full assignment & tracking privileges |
| **Student (Leader)** | Alex Rivera | `alex@joineazy.edu` | `Student@123` | Leader of **Alpha Innovators** |
| **Student (Leader)** | Emma Watson | `emma@joineazy.edu` | `Student@123` | Leader of **Byte Crafters** |
| **Student (Member)** | Sara Chen | `sara@joineazy.edu` | `Student@123` | Member of Alpha Innovators |
| **Student (Member)** | John Doe | `john@joineazy.edu` | `Student@123` | Member of Alpha Innovators |

> **Pro Tip**: The application UI features a **"Switch Demo User"** dropdown button in the top navigation bar, allowing you to switch between Professor and Student personas with a single click during live demos!

---

## Setup & Run Instructions

### Method 1: Docker Compose (Recommended)

To run the complete full-stack environment (Frontend, Backend, and PostgreSQL) in isolated Docker containers:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd joineazy
   ```

2. **Start all services**:
   ```bash
   docker compose up --build
   ```
   *(or run in background with `docker compose up --build -d`)*

3. **Access the application**:
   - **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **PostgreSQL Database**: `localhost:5432` (User: `postgres`, Pass: `postgrespassword`, DB: `joineazy`)

4. **Stop the containers**:
   ```bash
   docker compose down
   ```

---

### Method 2: Local Development (Standalone / Postgres)

If you prefer to run the application directly on your host machine without Docker:

#### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
- The backend automatically boots on `http://localhost:5000`.
- If a local PostgreSQL instance is running on `postgresql://postgres:postgres@localhost:5432/joineazy`, it connects and migrates tables automatically.
- If PostgreSQL is offline, it activates the built-in PostgreSQL in-memory engine (`pg-mem`) and auto-seeds the test dataset.

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your web browser.
- Vite proxies all `/api` requests to the backend server running on port `5000`.

---

## Key Design & Deployment Decisions

1. **Strict Two-Step Verification Flow**:
   - Assignment submissions are confirmed through an explicit 2-step modal dialog. Step 1 requires visiting the OneDrive folder and optional submission notes; Step 2 presents a verification checklist requiring an explicit checkbox confirmation ("Yes, I have submitted") before submitting. This prevents accidental submissions and mirrors real-world cloud submission pipelines.
2. **Dual PostgreSQL Architecture**:
   - Standard PostgreSQL connection pooling via `pg.Pool` for production and Docker containers.
   - Built-in zero-configuration PostgreSQL in-memory fallback engine (`pg-mem`) for developer convenience, guaranteeing that the application evaluates cleanly on any machine regardless of whether external database services are running.
3. **Optimized Group Targeting**:
   - Assignments support both `ALL` cohort targeting and `SPECIFIC_GROUPS` targeting via a many-to-many relationship table (`assignment_target_groups`). Students only see coursework relevant to their groups, eliminating clutter.
4. **Group Code Join Mechanism**:
   - Students can invite members by email/ID or share an alphanumeric join code (e.g. `ALPHA-88`), allowing fast group onboarding without administrative bottlenecks.
5. **Real-Time Visual Indicators & Gamification**:
   - Dynamic progress bars calculate percentage completion in real-time. Performance badges (`Top Performer`, `On Track`, `All Completed`) provide instant visual feedback to both students and professors.
6. **Containerization & Production Security**:
   - The frontend is served via an **Nginx** reverse proxy in Docker, ensuring high-performance static delivery and seamless API routing.
   - Sensitive credentials are encrypted with `bcryptjs` (salt rounds: 10), and all endpoints validate incoming requests using JWT tokens and JSON schemas.
