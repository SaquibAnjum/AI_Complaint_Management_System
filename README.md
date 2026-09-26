# AI-Assisted Complaint Management System

A production-style, full-stack complaint management web application designed for educational institutions, residential campuses, and organizations.

The system allows users to submit complaints, uses AI to extract useful information such as category, priority, and summary, and sends the complaint to the associated organization for **human review and manual status management**.

AI is used only as an assistance layer. The organization/admin always has control over the complaint lifecycle.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features by Role](#2-key-features-by-role)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Design Principles](#4-architecture--design-principles)
5. [AI Workflow](#5-ai-workflow)
6. [Complaint Lifecycle](#6-complaint-lifecycle)
7. [Directory Structure](#7-directory-structure)
8. [Setup & Installation](#8-setup--installation)
9. [Environment Variables](#9-environment-variables)
10. [Demo Accounts & Seed Data](#10-demo-accounts--seed-data)
11. [Running the Application](#11-running-the-application)
12. [REST API Documentation](#12-rest-api-documentation)
13. [Testing](#13-testing)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Project Overview

Traditional complaint systems often depend on manual classification and disconnected communication, which can make it difficult to understand, prioritize, and track complaints.

The **AI-Assisted Complaint Management System** addresses this by:

- Using **Google Gemini API** to analyze complaint descriptions.
- Extracting useful information such as:
  - Category
  - Priority
  - Summary
- Sending the complaint to the user's associated organization.
- Keeping AI suggestions **advisory only**.
- Allowing administrators to manually review and update complaints.
- Providing users with a dashboard to track their complaints.
- Maintaining a complaint timeline and status history.
- Providing notifications when important complaint events occur.
- Supporting multiple organizations through organization-specific user registration.

### Important Design Principle

> **AI assists with complaint understanding; it does not control the complaint lifecycle.**

The final decision regarding complaint classification and status remains with the organization/admin.

---

## 2. Key Features by Role

### Users

Users are people who submit complaints to their associated organization.

- **Account Registration**
  - Create an account using the organization's unique Organization ID.
  - User account is automatically associated with that organization.

- **Complaint Submission**
  - Submit a complaint through the web application.
  - Complaint description is analyzed by AI.

- **AI-Assisted Information Extraction**
  - Category
  - Priority
  - Short summary

- **My Complaints**
  - View all complaints submitted by the user.
  - Check current status.
  - View complaint details and history.

- **Complaint Timeline**
  - View important updates and status changes.

- **Resolution Confirmation**
  - Confirm whether a resolved complaint has been satisfactorily handled.
  - Provide feedback when applicable.

- **Notifications**
  - Receive notifications about complaint status changes and important updates.

---

### Administrators

Administrators manage complaints belonging to their organization.

- **Admin Dashboard**
  - View complaint statistics.
  - Monitor complaint statuses.
  - View category and priority information.

- **Complaint Management**
  - View complaints submitted by users.
  - Search and filter complaints.
  - Open complete complaint details.

- **AI Classification Review**
  - View AI-generated category, priority, and summary.
  - Review AI suggestions before taking action.

- **Manual Classification**
  - Change category.
  - Change priority.
  - Update other complaint information when required.

- **Manual Status Management**
  - Move complaints through the organization's workflow.
  - AI does not automatically change complaint status.

- **User Directory**
  - View users belonging to the organization.
  - Manage user account status where applicable.

- **Notifications**
  - System notifications can be generated when complaint information or status changes.

---

## 3. Technology Stack

### Backend

- **Language:** Python 3.12
- **Package Manager:** uv
- **Framework:** Flask
- **Database:** SQLite
- **ORM:** SQLAlchemy
- **Authentication:** JWT using `flask-jwt-extended`
- **Password Security:** Werkzeug password hashing
- **CORS:** Flask-CORS
- **AI Integration:** Google Gemini API using the `google-genai` SDK

### Frontend

- **Framework:** React
- **Build Tool:** Vite
- **Routing:** React Router
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Styling:** Vanilla CSS

---

## 4. Architecture & Design Principles

```text
                     React Frontend
                           |
                           | HTTP REST + JWT
                           v
                  Flask Backend API
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
       Routes          Services          Auth/RBAC
          |                |                |
          |                v                |
          |          AI Service             |
          |                |                |
          |                v                |
          |         Google Gemini           |
          |                                 |
          +----------------+----------------+
                           |
                           v
                    SQLAlchemy ORM
                           |
                           v
                       SQLite DB
```

### Main principles

1. **Authentication**
   - Users and administrators authenticate using JWT.

2. **Role-Based Access**
   - User-specific and admin-specific endpoints are protected.

3. **Organization Isolation**
   - Users belong to an organization.
   - Administrators manage complaints for their organization.

4. **Human-in-the-Loop AI**
   - AI provides suggestions.
   - Admin makes the final decision.

5. **Manual Complaint Lifecycle**
   - Complaint status is controlled by the organization/admin.
   - AI does not automatically move complaints between stages.

6. **Simple Architecture**
   - Flask handles APIs and business logic.
   - React handles the user interface.
   - SQLite stores application data.

---

## 5. AI Workflow

```text
User submits complaint
          |
          v
Flask receives complaint
          |
          v
AI Service analyzes complaint
          |
          v
Google Gemini API
          |
          v
Structured AI result
          |
     +----+----+
     |         |
   Success   Failure
     |         |
     v         v
AI category   Safe fallback
AI priority   values
AI summary
     |
     v
Complaint stored
     |
     v
Associated Organization
     |
     v
Admin reviews complaint
     |
     v
Admin can accept or modify
AI suggestions
```

### AI Responsibilities

The AI layer can help extract:

- **Category**
- **Priority**
- **Summary**

### AI Does NOT

- Automatically resolve complaints.
- Automatically close complaints.
- Automatically assign complaints to staff.
- Automatically change complaint stages.
- Make final administrative decisions.

---

## 6. Complaint Lifecycle

The complaint lifecycle is intentionally simple because there is no separate staff/technician workflow.

```text
                +-------------+
                |   PENDING   |
                +------+------+
                       |
                       | Admin reviews
                       v
                +-------------+
                | UNDER_REVIEW|
                +------+------+
                       |
                       | Admin works on complaint
                       | / changes status
                       v
                +-------------+
                | IN_PROGRESS |
                +------+------+
                       |
                       | Admin marks resolved
                       v
                +-------------+
                |  RESOLVED   |
                +------+------+
                       |
                +------+------+
                |             |
             Confirm        Reject
                |             |
                v             v
        +-------------+  +-------------+
        |  CONFIRMED  |  |   REOPENED  |
        +-------------+  +------+------+
                               |
                               | Admin reviews again
                               v
                         IN_PROGRESS
```

### Status Meaning

| Status | Meaning |
|---|---|
| `PENDING` | Complaint has been submitted and is waiting for admin review |
| `UNDER_REVIEW` | Admin has opened/reviewed the complaint |
| `IN_PROGRESS` | Organization is actively handling the complaint |
| `RESOLVED` | Admin considers the complaint resolved |
| `CONFIRMED` | User confirms satisfactory resolution |
| `REOPENED` | User rejects the resolution and the complaint needs further attention |

> The exact statuses can be adjusted according to the implementation, but the important rule is that **status changes are controlled manually by the organization/admin**.

---

## 7. Directory Structure

```text
Complaint_management_system/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask application factory
│   │   ├── config.py                # Environment configuration
│   │   ├── extensions.py            # SQLAlchemy, JWT, CORS
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User, role & organization relationship
│   │   │   ├── organization.py      # Organization entity
│   │   │   ├── complaint.py         # Complaint entity & status
│   │   │   ├── complaint_update.py  # Complaint history/timeline
│   │   │   ├── feedback.py          # User feedback
│   │   │   └── notification.py      # In-app notifications
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth_routes.py       # Register, login, current user
│   │   │   ├── organization_routes.py # Organization creation/management
│   │   │   ├── complaint_routes.py  # User complaint operations
│   │   │   ├── admin_routes.py      # Admin complaint management
│   │   │   ├── feedback_routes.py   # Ratings/comments
│   │   │   └── notification_routes.py # Notifications
│   │   │
│   │   ├── services/
│   │   │   ├── ai_service.py        # AI classification & fallback
│   │   │   └── notification_service.py
│   │   │
│   │   └── utils/
│   │       ├── decorators.py        # Role/auth decorators
│   │       ├── validators.py        # Input validation
│   │       └── helpers.py           # Response helpers
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_complaints.py
│   │   └── test_workflow.py
│   │
│   ├── run.py                       # Backend entrypoint
│   ├── seed.py                      # Optional development seed data
│   ├── pyproject.toml
│   ├── .env.example
│   └── complaints.db
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleRoute.jsx
│   │   │   ├── ComplaintCard.jsx
│   │   │   ├── ComplaintStatusBadge.jsx
│   │   │   ├── ComplaintTimeline.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Unauthorized.jsx
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── SubmitComplaint.jsx
│   │   │   │   ├── MyComplaints.jsx
│   │   │   │   └── ComplaintDetails.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ManageComplaints.jsx
│   │   │       ├── ComplaintReview.jsx
│   │   │       └── ManageUsers.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── utils/
│   │   │   └── constants.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 8. Setup & Installation

### Prerequisites

- Python 3.12
- Node.js 18+
- npm
- uv

### Step 1: Clone or Navigate to the Project

```bash
cd Complaint_management_system
```

### Step 2: Backend Setup

```bash
cd backend

cp .env.example .env

uv run python seed.py
```

If you are using Windows PowerShell, you can create the `.env` file manually from `.env.example`.

### Step 3: Frontend Setup

```bash
cd ../frontend

npm install
```

---

## 9. Environment Variables

Create `backend/.env`:

```ini
FLASK_APP=run.py
FLASK_ENV=development

SECRET_KEY=change-this-secret-key
JWT_SECRET_KEY=change-this-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24

DATABASE_URL=sqlite:///complaints.db

FRONTEND_URL=http://localhost:5173

# Optional Google Gemini API configuration
# If the API key is unavailable, the application should use its fallback behavior.

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=your_configured_gemini_model
```

> Never commit real API keys or production secrets to GitHub.

---

## 10. Demo Accounts & Seed Data

Demo data depends on the current `seed.py` implementation.

A typical development setup can contain:

| Role | Purpose |
|---|---|
| Admin | Manage organization complaints and users |
| User | Submit and track complaints |

If seed data is not required, the database can be created without demo records.

### Recommended Development Flow

```text
Create Organization
        |
        v
Organization receives unique Organization ID
        |
        v
User registers using Organization ID
        |
        v
User becomes associated with Organization
        |
        v
User submits complaint
        |
        v
Admin manages complaint
```

---

## 11. Running the Application

### Terminal 1 — Flask Backend

```bash
cd backend
uv run python run.py
```

Backend:

```text
http://localhost:5000
```

### Terminal 2 — React Frontend

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

## 12. REST API Documentation

The exact endpoints should match the current backend implementation.

### 12.1 Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a user account |
| `POST` | `/api/auth/login` | None | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | JWT | Get current user profile |
| `POST` | `/api/auth/logout` | None/JWT | Logout client session |

---

### 12.2 Organization

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/organizations` | Public/Backend controlled | Create an organization |
| `GET` | `/api/organizations/<id>` | JWT | Get organization information |

The exact organization endpoints depend on the current backend implementation.

---

### 12.3 User Complaint Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/complaints` | JWT | Submit a new complaint |
| `GET` | `/api/complaints` | JWT | List the user's complaints |
| `GET` | `/api/complaints/<id>` | JWT | View complaint details |
| `PUT` | `/api/complaints/<id>` | JWT | Update complaint where permitted |
| `POST` | `/api/complaints/<id>/confirm` | JWT | Confirm satisfactory resolution |
| `POST` | `/api/complaints/<id>/reject` | JWT | Reject resolution / reopen complaint |

---

### 12.4 Administrator Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | ADMIN | View organization complaint statistics |
| `GET` | `/api/admin/complaints` | ADMIN | View organization complaints |
| `GET` | `/api/admin/complaints/<id>` | ADMIN | View complaint details |
| `PUT` | `/api/admin/complaints/<id>/review` | ADMIN | Review a complaint |
| `PUT` | `/api/admin/complaints/<id>/classification` | ADMIN | Modify AI-suggested classification |
| `PUT` | `/api/admin/complaints/<id>/status` | ADMIN | Manually change complaint status |
| `GET` | `/api/admin/users` | ADMIN | View users in the organization |
| `PUT` | `/api/admin/users/<id>/status` | ADMIN | Activate/deactivate a user |

---

### 12.5 Feedback & Notification Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/complaints/<id>/feedback` | JWT | Submit rating/comment |
| `GET` | `/api/complaints/<id>/feedback` | JWT | View complaint feedback |
| `GET` | `/api/notifications` | JWT | Get user's notifications |
| `PUT` | `/api/notifications/<id>/read` | JWT | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | JWT | Mark all notifications as read |

> API paths above are documentation targets. Keep them synchronized with the actual Flask routes in the project.

---

## 13. Testing

Run the backend test suite:

```bash
cd backend

uv run python -m unittest discover -s tests -p "test_*.py"
```

The tests should cover areas such as:

- Authentication
- Password hashing
- JWT authentication
- User registration
- Organization association
- Access control
- Complaint creation
- AI extraction/fallback behavior
- Admin complaint management
- Complaint status changes
- User confirmation/reopen flow
- Notifications
- Feedback

---

## 14. Future Roadmap

Possible future improvements:

- **File Attachments**
  - Allow users to attach images or documents to complaints.

- **Email Notifications**
  - Send email notifications for important status changes.

- **SLA Tracking**
  - Track how long complaints remain unresolved.

- **Advanced Analytics**
  - Organization-level complaint trends and reports.

- **Multi-Tenant Improvements**
  - Stronger organization-level data isolation and configuration.

- **AI Improvements**
  - Better category and priority extraction.
  - Improved summaries.
  - AI-assisted duplicate complaint detection.

- **Search & Filtering**
  - Advanced complaint search and filtering.

---

## Project Philosophy

The system follows a simple principle:

> **AI should assist people, not replace administrative decisions.**

The AI layer helps understand and structure complaint information, while the organization remains responsible for reviewing complaints, changing statuses, and deciding when a complaint is resolved.

This keeps the system practical, explainable, and easy to manage.

---

## License

This project is intended for educational, portfolio, and development purposes.
