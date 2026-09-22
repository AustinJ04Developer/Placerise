# Placerise: Placement Training Management & Progress Tracking System

> **A Production-Grade, Student-History-Centric Placement Training Lifecycle Management Platform**

Placerise is built for college Placement Training Cells to manage and monitor student training journeys across all academic years, batches, departments, and class sections. 

Unlike basic CRUD student-management apps, Placerise maintains an **immutable, multi-year historical training journey** for every student, decoupling their permanent identity (`registerNumber`) from ephemeral academic groupings (`ClassSection`).

---

## Key Highlights & Core Capabilities

### 1. 4-Year Student Training Journey
- A student in **Final Year &rarr; CSE &rarr; Section A** retains their complete training history starting from Year 1 to Year 4:
  - **Year 1**: Aptitude Training, Communication, Coding Basics
  - **Year 2**: Java Training, SQL Training, GD Training
  - **Year 3**: Python Training, Mock Interview, Resume Training
  - **Year 4**: Advanced Java Full Stack, Aptitude Revision, HR Training, Mock Interview
- Shows per-program attendance rates, pass/fail status, test scores, and training gaps without overwriting past data when promoted.

### 2. 50-Student IV CSE A Class Matrix
- Interactive **50 &times; N Class Training Matrix**:
  - Rows: All 50 students (`23CS001` through `23CS050`).
  - Columns: Assigned training programs spanning all 4 academic years.
  - Cells: Real-time visual status badges (`✓ Completed`, `✗ Gap/Low Attendance`, `⏳ Scheduled`).
  - Summary metrics: Program completion ratio, average attendance %, and gap highlights (&lt; 75%).
  - One-click CSV export of the entire 50-student matrix.

### 3. Reverse Training Query ("Who has NOT attended this training?")
- Answer institutional queries instantly:
  - Total Assigned vs Attended vs Absent vs Pending.
  - Drill down into the absent student roster with contact details, roll numbers, and one-click CSV export for remedial scheduling.

### 4. Bulk Operations & Governance
- **Bulk Attendance Sheet**: Matrix roster with "Mark All Present", quick status toggles (`Present`, `Absent`, `Late`), remarks, and automatic threshold calculations.
- **Bulk Assessment Grading**: Reactive score entry calculating percentage, grades (`A+`, `A`, `B`, `C`, `F`), and pass/fail status.
- **Governance & Approvals**: Faculty attendance corrections and grade modifications submit approval requests to the Placement Officer, preserving original vs proposed values.
- **Append-Only Audit Trail**: Cryptographically logs every authentication, attendance update, assessment change, and approval.

### 5. Multi-Device Responsive UI
- Fully responsive across mobile, tablet, and desktop screens.
- Mobile off-canvas navigation drawer with backdrop overlay.
- Adaptive dual-mode student roster: high-density table on desktop/tablet & swipeable card list on mobile.

---

## Demo Accounts & Role-Based Access Control

The database is pre-seeded with 50 students in `IV CSE A` and verified credentials for all 4 roles:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Placement Officer** | `officer@placerise.edu` | `Admin@123` | Global institution management, program builder, approvals queue, audit trail, reports. |
| **Faculty / Trainer** | `faculty@placerise.edu` | `Faculty@123` | Assigned programs, session creation, bulk attendance marking, assessment grading. |
| **Class Incharge** | `incharge@placerise.edu` | `Incharge@123` | Scoped to **IV CSE A** (50 students), matrix view, attendance verification, change requests. |
| **Student (Student 01)** | `student@placerise.edu` | `Student@123` | Scoped strictly to Aarav Sharma (`23CS001`), 4-year journey, attendance %, placement profile. |

---

## Tech Stack

- **Frontend**:
  - React 18, TypeScript, Tailwind CSS
  - React Router v6, TanStack Query, Axios
  - Recharts (visual KPI distributions & attendance charts)
  - Lucide React (modern enterprise icon system)
  - Socket.IO client (real-time notification architecture)
- **Backend**:
  - Node.js, Express.js, TypeScript
  - Mongoose (MongoDB ODM with optimized indexes)
  - JWT Access Token + Refresh Token Rotation
  - bcrypt password hashing
  - Structured modular architecture (Controller &rarr; Service &rarr; Model)
  - Immutable Audit Logger
- **Database**:
  - MongoDB running on `mongodb://127.0.0.1:27017/placerise`

---

## Architecture & Data Model

```text
Student (Permanent: 23CS001)
   │
   ├── StudentAcademicHistory (Snapshots of Year 1, 2, 3, 4)
   │     ├── Year 1 (2023–24) &rarr; I CSE A (Roll 01)
   │     ├── Year 2 (2024–25) &rarr; II CSE A (Roll 01)
   │     ├── Year 3 (2025–26) &rarr; III CSE A (Roll 01)
   │     └── Year 4 (2026–27) &rarr; IV CSE A (Roll 01)
   │
   ├── TrainingEnrollment (Linked per program & year of study)
   ├── AttendanceRecord (Session-level records)
   ├── AssessmentResult (Grades and marks)
   └── PlacementProfile (CGPA, backlogs, skills, readiness score)
```

---

## Project Structure

```text
Placerise/
├── server/
│   ├── src/
│   │   ├── config/            # Database connection & constants
│   │   ├── models/            # 18 Mongoose models (Student, History, Training, etc.)
│   │   ├── middleware/        # JWT auth, RBAC, audit logger, error handler, Zod
│   │   ├── modules/           # auth, academics, students, training, attendance, etc.
│   │   ├── seed/              # 50-student IV CSE A 4-year seed script
│   │   ├── app.ts             # Express setup
│   │   └── server.ts          # HTTP server entrypoint
│   └── package.json
└── client/
    ├── src/
    │   ├── app/               # AuthContext & ThemeContext
    │   ├── layouts/           # AppLayout, Sidebar (Mobile Drawer), Navbar
    │   ├── features/          # Dashboard, Students, Matrix, Training, Reverse Query, etc.
    │   ├── services/          # Typed Axios client
    │   └── types/             # TypeScript domain definitions
    └── package.json
```

---

## Running Locally

### 1. Seed the Database (50 Students + 4-Year Journey)
```bash
npm --prefix server run seed
```

### 2. Start the Backend (Port 5000)
```bash
npm --prefix server run dev
```

### 3. Start the Frontend (Port 5173)
```bash
npm --prefix client run dev
```

Navigate to `http://localhost:5173` in your browser and log in with any demo role.
