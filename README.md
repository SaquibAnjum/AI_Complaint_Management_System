# AI-Assisted Complaint Management System

A production-style, portfolio-quality, full-stack web application designed for educational institutions, residential campuses, and enterprise organizations. The system facilitates end-to-end complaint filing, automated AI-assisted triage and classification (powered by Google Gemini), administrator review with human-in-the-loop override authority, technician dispatch, status audit trails, resolution verification, and feedback ratings.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features by Role](#key-features-by-role)
3. [Technology Stack](#technology-stack)
4. [Architecture & Design Principles](#architecture--design-principles)
5. [AI Workflow & Human-in-the-Loop Governance](#ai-workflow--human-in-the-loop-governance)
6. [Complaint Lifecycle State Machine](#complaint-lifecycle-state-machine)
7. [Directory Structure](#directory-structure)
8. [Setup & Installation Guide](#setup--installation-guide)
9. [Environment Variables](#environment-variables)
10. [Demo Accounts & Seed Data](#demo-accounts--seed-data)
11. [Running the Application](#running-the-application)
12. [REST API Documentation](#rest-api-documentation)
13. [Testing](#testing)
14. [Future Roadmap](#future-roadmap)

---

## 1. Project Overview

In traditional complaint desks, complaints often languish in unclassified inboxes or get routed to the wrong departments due to ambiguous descriptions. 

The **AI-Assisted Complaint Management System** solves this by:
- Employing **Google Gemini API** (`google-genai` SDK) to instantly analyze raw grievance text and extract the most appropriate category, urgency/priority, relevant department, and a concise summary.
- Ensuring **AI Never Has Final Authority**: Administrative staff retain 100% override capabilities to correct priority, reassign departments, or update categories before assigning work.
- Providing **Role-Enforced Workspaces**: Dedicated dashboards for Complainants, Administrators, and Department Technicians.
- Delivering a **Complete Audit Trail**: Every status change, reassignment, and technician note is timestamped in an immutable timeline.
- Enabling **User Verification & Reopen Loop**: The original user verifies if the repair was satisfactory, with options to confirm, rate, or reopen the ticket with a rejection reason.

---

## 2. Key Features by Role

### Complainants (USER: Students / Residents / Staff)
- **Interactive Filing**: Submit grievances with instant AI categorization preview.
- **Personal Dashboard**: Track submitted tickets with color-coded status badges and priority tags.
- **Audit Timeline**: View real-time technician notes, inspections, and status transitions.
- **Resolution Verification**: Confirm satisfactory resolution or reject with specific reasons (moves ticket back to `REOPENED`).
- **5-Star Rating & Review**: Leave qualitative and quantitative feedback upon ticket closure.
- **In-App Notifications**: Real-time alerts on ticket assignments, status changes, and closures.

### Administrators (ADMIN: Dean / Facilities Manager / Ops Lead)
- **Executive Analytics Dashboard**: Metric counters, status distributions, category breakdowns, and department workload charts.
- **Triage & Classification Review**: Side-by-side comparison of AI advisory suggestions vs. approved classifications.
- **Direct Overrides**: Edit category, priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and department with one click.
- **Technician Dispatch**: Assign or reassign tickets to active staff members with optional instructions.
- **User & Staff Directory**: Manage registered users, activate/deactivate accounts, and inspect staff assignments.
- **Advanced Filtering & Search**: Multi-filter complaint lists with server-side pagination.

### Department Staff (STAFF: Maintenance / IT Support / Housekeeping)
- **Dedicated Technician Workspace**: Clean queue showing only tickets assigned to the logged-in staff member.
- **Work Lifecycle Actions**:
  - Start Work (`IN_PROGRESS`).
  - Post work progress notes (e.g., parts ordered, inspection logs).
  - Mark `RESOLVED` with mandatory resolution documentation.

---

## 3. Technology Stack

### Backend
- **Language**: Python 3.12 (managed via modern `uv` packaging)
- **Framework**: Flask (Application Factory architecture)
- **Database**: SQLite with SQLAlchemy ORM (modern 2.0 query patterns)
- **Authentication**: JWT authentication (`flask-jwt-extended`) with role-based claims
- **Security**: Passwords hashed using `werkzeug.security` (PBKDF2 SHA-256)
- **CORS**: Cross-Origin Resource Sharing handled via `flask-cors`
- **AI Integration**: Google Gemini API via the official `google-genai` Python SDK

### Frontend
- **Framework**: React 19 SPA built with Vite
- **Routing**: React Router v7 with protected routes and role guards
- **HTTP Client**: Axios with centralized request/response interceptors
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System (clean variables, responsive layout, glassmorphic accents, zero Tailwind bloat)

---

## 4. Architecture & Design Principles

```
  ┌──────────────────────────────────────────────────────────────┐
  │                         React 19 SPA                         │
  │  (AuthContext, ProtectedRoute, RoleRoute, Central Axios API)  │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ HTTP REST (Bearer JWT)
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                        Flask Backend                         │
  │                                                              │
  │  ┌────────────────────┐   ┌───────────────────────────────┐  │
  │  │ Route Blueprints   │   │ Security & Auth Layer         │  │
  │  │ - /api/auth        │   │ - JWT Verification            │  │
  │  │ - /api/complaints  │   │ - @role_required RBAC         │  │
  │  │ - /api/admin       │   │ - Model Ownership Checks      │  │
  │  │ - /api/staff       │   └───────────────────────────────┘  │
  │  │ - /api/feedback    │                                      │
  │  │ - /api/notifications                                      │
  │  └─────────┬──────────┘                                      │
  │            │                                                 │
  │  ┌─────────▼──────────┐   ┌───────────────────────────────┐  │
  │  │ Service Layer      │   │ SQLAlchemy ORM Models         │  │
  │  │ - AIService        │   │ - User, Complaint, Assignment │  │
  │  │ - NotificationSvc  │   │ - ComplaintUpdate, Feedback   │  │
  │  └─────────┬──────────┘   │ - Notification                │  │
  │            │              └───────────────┬───────────────┘  │
  └────────────┼──────────────────────────────┼──────────────────┘
               │                              │
               ▼                              ▼
      ┌─────────────────┐             ┌───────────────┐
      │ Google Gemini   │             │ SQLite DB     │
      │ AI API          │             │ complaints.db │
      └─────────────────┘             └───────────────┘
```

---

## 5. AI Workflow & Human-in-the-Loop Governance

```
User submits complaint description
          │
          ▼
Flask Backend invokes AIService (app/services/ai_service.py)
          │
          ▼
Google Gemini API analyzes grievance text
          │
          ▼
Structured JSON output parsed & validated against controlled categories
          │
          ├──> Success: Stored as ai_category, ai_priority, ai_department, ai_summary
          └──> Fallback: Defaults applied if API key is unconfigured or rate-limited
          │
          ▼
Ticket marked PENDING
          │
          ▼
Administrator reviews side-by-side comparison:
┌─────────────────────────────────┬─────────────────────────────────┐
│   AI Suggested (Advisory)       │   Admin Approved (Final)        │
│   Category: IT Support          │   Category: IT Support          │
│   Priority: CRITICAL            │   Priority: HIGH (Overridden)   │
│   Department: IT Support        │   Department: IT Support        │
└─────────────────────────────────┴─────────────────────────────────┘
          │
          ▼
Administrator assigns approved ticket to technician
```

---

## 6. Complaint Lifecycle State Machine

```
              ┌──────────────┐
              │   PENDING    │ ◄─── (Created by user)
              └──────┬───────┘
                     │ (Admin reviews)
                     ▼
              ┌──────────────┐
              │ UNDER_REVIEW │
              └──────┬───────┘
                     │ (Admin assigns staff)
                     ▼
              ┌──────────────┐
              │   ASSIGNED   │
              └──────┬───────┘
                     │ (Staff starts work)
                     ▼
         ┌────►┌─────────────┐
         │     │ IN_PROGRESS │
(Reopen) │     └──────┬──────┘
         │            │ (Staff marks resolved)
         │            ▼
         │     ┌─────────────┐
         │     │  RESOLVED   │
         │     └──────┬──────┘
         │            │
   (Reject)     ┌─────┴─────┐ (Confirm)
         │      │           │
         │      ▼           ▼
   ┌─────┴────┐       ┌───────────┐
   │ REOPENED │       │ CONFIRMED │ ◄─── (User submits 1-5 star review)
   └──────────┘       └───────────┘
```

---

## 7. Directory Structure

```
Complaint_management_system/
├── backend/
│   ├── app/
│   │   ├── __init__.py               # Flask application factory & error handlers
│   │   ├── config.py                 # Environment configurations (Dev, Test, Prod)
│   │   ├── extensions.py             # SQLAlchemy, JWTManager, CORS instances
│   │   │
│   │   ├── models/                   # Database entities & relationships
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User authentication & roles
│   │   │   ├── complaint.py          # Complaint entity & status lifecycle
│   │   │   ├── assignment.py         # Staff assignment records
│   │   │   ├── complaint_update.py   # Immutable audit timeline events
│   │   │   ├── feedback.py           # User ratings & reviews
│   │   │   └── notification.py       # In-app notifications
│   │   │
│   │   ├── routes/                   # REST API controllers
│   │   │   ├── __init__.py
│   │   │   ├── auth_routes.py        # Register, Login, Me
│   │   │   ├── complaint_routes.py   # User complaints & lifecycle actions
│   │   │   ├── admin_routes.py       # Triage, Override, Assign, Analytics
│   │   │   ├── staff_routes.py       # Technician queue, Updates, Resolution
│   │   │   ├── feedback_routes.py    # Ratings & comments
│   │   │   └── notification_routes.py# In-app notification management
│   │   │
│   │   ├── services/                 # Reusable business logic
│   │   │   ├── ai_service.py         # Google Gemini classification & fallback
│   │   │   └── notification_service.py # System notification dispatcher
│   │   │
│   │   └── utils/                    # Decorators, validators, response helpers
│   │       ├── decorators.py         # @role_required, @admin_required, @staff_required
│   │       ├── validators.py         # Input validation & schema checks
│   │       └── helpers.py            # Standardized API response format
│   │
│   ├── tests/                        # Automated unit & integration tests
│   │   ├── test_auth.py
│   │   ├── test_complaints.py
│   │   └── test_workflow.py
│   │
│   ├── run.py                        # Entrypoint & CLI commands (init-db, seed-db)
│   ├── seed.py                       # Demo accounts & realistic sample complaints
│   ├── pyproject.toml                # uv package dependencies
│   ├── .env.example                  # Environment template
│   └── complaints.db                 # SQLite development database
│
├── frontend/
│   ├── src/
│   │   ├── components/               # Reusable UI widgets
│   │   │   ├── Navbar.jsx            # Header, user badge, notification bell
│   │   │   ├── Sidebar.jsx           # Role-based navigational drawer
│   │   │   ├── ProtectedRoute.jsx    # Authentication route guard
│   │   │   ├── RoleRoute.jsx         # Role authorization route guard
│   │   │   ├── ComplaintCard.jsx     # Card component for complaint items
│   │   │   ├── ComplaintStatusBadge.jsx # Color-coded status & priority pills
│   │   │   ├── ComplaintTimeline.jsx # Visual audit history trail
│   │   │   ├── StatsCard.jsx         # Metric summary card
│   │   │   ├── LoadingSpinner.jsx    # Polished loader
│   │   │   ├── EmptyState.jsx        # Clean zero-data placeholder
│   │   │   └── Toast.jsx             # In-app toast alerts
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global authentication state
│   │   │
│   │   ├── pages/                    # Views
│   │   │   ├── Login.jsx             # Sign in with 1-click demo fillers
│   │   │   ├── Register.jsx          # Sign up for accounts
│   │   │   ├── Unauthorized.jsx      # 403 Forbidden screen
│   │   │   │
│   │   │   ├── user/                 # Complainant pages
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── SubmitComplaint.jsx
│   │   │   │   ├── MyComplaints.jsx
│   │   │   │   └── ComplaintDetails.jsx
│   │   │   │
│   │   │   ├── admin/                # Administrator pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ManageComplaints.jsx
│   │   │   │   ├── ComplaintReview.jsx
│   │   │   │   ├── ManageUsers.jsx
│   │   │   │   └── StaffManagement.jsx
│   │   │   │
│   │   │   └── staff/                # Technician pages
│   │   │       ├── StaffDashboard.jsx
│   │   │       ├── AssignedComplaints.jsx
│   │   │       └── ComplaintWork.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js                # Central Axios client
│   │   ├── utils/
│   │   │   └── constants.js          # Statuses, categories, departments, colors
│   │   ├── App.jsx                   # Router configuration & layouts
│   │   ├── index.css                 # Vanilla CSS design system
│   │   └── main.jsx                  # React entry point
│   │
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 8. Setup & Installation Guide

### Prerequisites
- **Python 3.12** installed
- **Node.js 18+** and **npm** installed
- **uv** package manager installed (`pip install uv` or official standalone installer)

### Step 1: Clone or Navigate to the Project
```bash
cd Complaint_management_system
```

### Step 2: Backend Setup
```bash
cd backend

# Environment configuration
cp .env.example .env

# Initialize and seed database
uv run python seed.py
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install npm dependencies
npm install
```

---

## 9. Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```ini
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production-123456
JWT_SECRET_KEY=jwt-secret-key-change-in-production-654321
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24
DATABASE_URL=sqlite:///complaints.db
FRONTEND_URL=http://localhost:5173

# Optional: Google Gemini API Key
# If omitted or left empty, the application uses built-in graceful fallback
# defaults without interrupting complaint submission!
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 10. Demo Accounts & Seed Data

The database comes pre-seeded with realistic institutional test complaints and the following demo accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@example.com` | `admin123` |
| **Staff (Maint.)** | Rajesh Kumar (Maintenance) | `staff@example.com` | `staff123` |
| **Staff (IT)** | Priya Sharma (IT Support) | `itstaff@example.com` | `staff123` |
| **Student** | Alice Johnson (Student) | `user@example.com` | `user123` |
| **Resident** | Bob Smith (Resident) | `bob@example.com` | `user123` |

> [!TIP]
> On the **Sign In** screen (`/login`), click the quick-fill buttons (**Admin**, **Staff**, **Student**) to instantly autofill demo credentials!

---

## 11. Running the Application

### Terminal 1 — Start Flask Backend Server:
```bash
cd backend
uv run python run.py
```
*Backend runs on: `http://localhost:5000`*

### Terminal 2 — Start Vite React Frontend:
```bash
cd frontend
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

Open your browser and navigate to: `http://localhost:5173`

---

## 12. REST API Documentation

All responses follow a predictable JSON contract:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": { ... },
  "pagination": { "page": 1, "per_page": 10, "total": 50, "pages": 5 }
}
```

### 12.1 Authentication Endpoints
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Any | Register new account (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login` | None | Any | Authenticate and retrieve JWT token |
| `GET` | `/api/auth/me` | JWT | Any | Get current user profile |
| `POST` | `/api/auth/logout` | None | Any | Invalidate client session |

### 12.2 Complaint Endpoints (User)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | JWT | USER | Submit new complaint with AI assistance |
| `GET` | `/api/complaints` | JWT | USER | List own complaints (supports filtering & pagination) |
| `GET` | `/api/complaints/<id>` | JWT | Owner/Admin | View complaint details, timeline, and staff info |
| `PUT` | `/api/complaints/<id>` | JWT | Owner | Edit complaint details (only permitted in `PENDING` state) |
| `POST` | `/api/complaints/<id>/confirm` | JWT | Owner | Confirm satisfactory resolution (`RESOLVED` &rarr; `CONFIRMED`) |
| `POST` | `/api/complaints/<id>/reject` | JWT | Owner | Reject resolution with reason (`RESOLVED` &rarr; `REOPENED`) |
| `POST` | `/api/complaints/<id>/reopen` | JWT | Owner | Reopen confirmed ticket (`CONFIRMED` &rarr; `REOPENED`) |

### 12.3 Administrator Endpoints
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | JWT | ADMIN | Aggregate counts by status, priority, category, department |
| `GET` | `/api/admin/complaints` | JWT | ADMIN | Multi-filter complaint search across the entire institution |
| `GET` | `/api/admin/complaints/<id>`| JWT | ADMIN | Detailed review panel |
| `PUT` | `/api/admin/complaints/<id>/review` | JWT | ADMIN | Move ticket from `PENDING` to `UNDER_REVIEW` |
| `PUT` | `/api/admin/complaints/<id>/classification` | JWT | ADMIN | Override category, priority, or department |
| `PUT` | `/api/admin/complaints/<id>/assign` | JWT | ADMIN | Assign/reassign ticket to a staff member |
| `GET` | `/api/admin/staff` | JWT | ADMIN | Get list of active staff members |
| `GET` | `/api/admin/users` | JWT | ADMIN | User management directory |
| `PUT` | `/api/admin/users/<id>/status` | JWT | ADMIN | Activate / Deactivate user account |

### 12.4 Staff Endpoints
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/staff/complaints` | JWT | STAFF | View queue of assigned tickets |
| `GET` | `/api/staff/complaints/<id>`| JWT | Assigned Staff | View ticket details |
| `PUT` | `/api/staff/complaints/<id>/status` | JWT | Assigned Staff | Change status (e.g., mark `IN_PROGRESS`) |
| `POST`| `/api/staff/complaints/<id>/updates`| JWT | Assigned Staff | Post progress notes to the audit timeline |
| `PUT` | `/api/staff/complaints/<id>/resolve`| JWT | Assigned Staff | Mark resolved with required resolution remarks |

### 12.5 Feedback & Notification Endpoints
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints/<id>/feedback` | JWT | Owner | Submit 1-5 star rating and comment |
| `GET` | `/api/complaints/<id>/feedback` | JWT | Any | Get feedback for a complaint |
| `GET` | `/api/notifications` | JWT | Any | Retrieve user's in-app notifications |
| `PUT` | `/api/notifications/<id>/read` | JWT | Owner | Mark single notification as read |
| `PUT` | `/api/notifications/read-all` | JWT | Owner | Mark all notifications as read |

---

## 13. Testing

Run the full automated test suite using Python's standard `unittest`:

```bash
cd backend
uv run python -m unittest discover -s tests -p "test_*.py"
```

The test suite validates:
- **Authentication**: User registration, password hashing, token issuance, duplicate checks, validation errors.
- **Access Control & Ownership**: Role verification, route blocking, and preventing users from viewing other users' private complaints.
- **Complaint Submission & AI Fallback**: Ensuring complaint creation succeeds 100% even without external AI keys.
- **End-to-End Workflow**: Filing &rarr; AI Analysis &rarr; Admin Review &rarr; Classification Override &rarr; Staff Assignment &rarr; In-Progress Status &rarr; Resolution &rarr; Rejection & Reopen &rarr; Re-resolution &rarr; User Confirmation &rarr; Feedback Ratings.

---

## 14. Future Roadmap
- **Attachments**: Support for photo/evidence uploads (e.g. broken hardware photos).
- **Email/SMS Alerts**: Integration with SendGrid/Twilio for external notifications.
- **SLA Escalation**: Automatic alert triggers when high-priority tickets exceed 48 hours without staff assignment.
- **Multi-tenant Support**: Support for multiple colleges or departments with segregated administration.
