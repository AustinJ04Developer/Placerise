# Placerise: Placement Training Management & Progress Tracking System

> **A Production-Grade, Student-History-Centric Placement Training Lifecycle & Institutional Tracking Platform**

Placerise is an institutional platform designed for College Placement Training Cells, Academic Departments, and Faculty. It manages, tracks, and monitors student training journeys across all academic years, batches, departments, and dynamic class sections.

Unlike simple student directory tools, Placerise maintains an **immutable, multi-year historical training journey** for every student—decoupling their permanent institutional identity (`registerNumber`) from ephemeral academic groupings (`ClassSection`) as they progress from Year 1 to Year 4.

---

## 🌟 Key Highlights & Core Capabilities

### 1. 4-Year Longitudinal Student Training Journey
- Tracks a student's complete training history from Year 1 through Year 4 across multiple specialized domains:
  - **Aptitude & Reasoning**: Quantitative, Logical, Verbal Drills
  - **Programming & Coding**: Data Structures, Algorithms, Core Languages
  - **Full Stack & Database**: Enterprise Tech Stacks, SQL, Web Architectures
  - **Soft Skills & Communication**: Corporate Communication, Resume Preparation, Group Discussions
  - **Mock & HR Interviews**: Technical and HR Mock Interview rounds
- Records per-program attendance percentages, pass/fail status, test scores, and training gaps without overwriting past history upon academic promotion.

### 2. Dynamic Class Training Matrix
- **Flexible Class-Level Matrix**: Dynamically adapts to any class size and section roster (not fixed to hardcoded numbers).
  - **Rows**: Real-time enrolled student rosters for any selected department and section.
  - **Columns**: Assigned training programs across academic years.
  - **Status Badges**: Real-time visual compliance indicators (`✓ Completed`, `✗ Gap / Low Attendance`, `⏳ Scheduled`).
  - **Quick Filters**: Filter by all students, students with training gaps (&lt; 75% attendance), or 100% completed.
  - **One-Click CSV Export**: Instant export of class training records for institutional accreditation and audits.

### 3. Reverse Training Query ("Who has NOT attended this training?")
- Answer institutional training queries instantly:
  - Instant calculations: **Total Assigned vs Attended vs Absent vs Pending**.
  - Drill down into non-attendees with contact numbers, roll numbers, and one-click CSV export for remedial scheduling.

### 4. Bulk Operations, Governance & Audit Trail
- **Bulk Session Attendance**: High-density matrix sheet with "Mark All Present", quick status toggles (`Present`, `Absent`, `Late`), session remarks, and automated attendance rate calculation.
- **Bulk Assessment Grading**: Reactive score entry calculating percentage, grades (`A+`, `A`, `B`, `C`, `F`), and pass/fail thresholds.
- **Governance & Approval Workflows**: Faculty attendance corrections and grade modifications require Placement Officer approval, preserving original vs proposed values.
- **Append-Only Audit Trail**: Cryptographically logs every authentication, record update, approval request, and operational event.

### 5. Role-Based Real-Time Dashboard
- Dynamic KPI metrics and domain distribution charts driven by live database queries:
  - **Historical Program Attendance Bar Chart**: Dynamic benchmark comparisons (&ge; 75%).
  - **Training Domain Mix Pie Chart**: Live distribution across configured training tracks.
  - Responsive empty states when newly initialized or awaiting session data.

---

## 👥 Role-Based Access Control (RBAC)

Placerise implements strict permission boundaries across 5 institutional roles:

| Role | Target Users | Permissions & Access Scope |
| :--- | :--- | :--- |
| **Placement Officer** | Director & Placement Team | Institutional oversight, program creator, approval decisions, audit trail, reports, and system settings. |
| **Head of Department (HOD)** | Department Heads | Department-scoped analytics, class rosters, departmental matrix, training oversight, and report exports. |
| **Faculty / Trainer** | Subject Faculty & Trainers | Assigned programs, session scheduling, bulk attendance marking, assessment evaluations, and approval requests. |
| **Class Incharge** | Class Advisors / Mentors | Section-scoped student roster, section training matrix, absentee monitoring, and student gap tracking. |
| **Student** | Enrolled Students | Self-service portal: personal 4-year training journey, attendance compliance, assessment feedback, and placement profile. |

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **Framework & Language**: React 18, TypeScript, Vite
- **Styling & Icons**: Tailwind CSS, Lucide React
- **Routing & State**: React Router v6, Axios, Context API (`AuthContext`, `ThemeContext`)
- **Visualizations**: Recharts (dynamic bar charts & pie charts)
- **Deployment Target**: Netlify (SPA configured with `_redirects` & `netlify.toml`)

### Backend (`server/`)
- **Runtime & Framework**: Node.js, Express, TypeScript (`tsx`)
- **Database ODM**: Mongoose 8 (MongoDB Atlas)
- **Security & Auth**: JWT (Access + Refresh Token rotation), bcryptjs, Helmet, Rate Limiting
- **Validation**: Zod schema validation
- **Architecture**: Modular structure (Controller &rarr; Service &rarr; Model)

---

## 📁 Repository Structure

```text
Placerise/
├── client/                     # Frontend Single Page Application (React + Vite)
│   ├── public/                 # Static assets & Netlify SPA _redirects
│   ├── src/
│   │   ├── app/context/        # Auth & Theme context providers
│   │   ├── features/           # Dashboard, Academics, Training, Matrix, Approvals, Reports
│   │   ├── layouts/            # Responsive AppLayout, Sidebar drawer, Navbar
│   │   ├── services/           # Configured Axios client with JWT interceptors
│   │   ├── types/              # TypeScript domain types & interfaces
│   │   └── vite-env.d.ts       # Typed Vite environment variables
│   ├── .env                    # Client environment configuration
│   ├── netlify.toml            # Netlify build & SPA routing configuration
│   └── package.json
│
├── server/                     # Backend API Server (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # MongoDB connection, RBAC roles & constants
│   │   ├── middleware/         # Auth verification, role checks, audit logger, error handling
│   │   ├── models/             # 19 Mongoose models (User, Student, TrainingProgram, etc.)
│   │   ├── modules/            # Domain modules (auth, dashboard, training, attendance, etc.)
│   │   └── seed/               # Maintenance scripts (cleanupData, migrateLocalToCloud, statusCheck)
│   ├── .env                    # Server environment variables & database connection
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Configuration

### Server Configuration (`server/.env`)
Create `server/.env` with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# JWT Authentication Secrets
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Allowed Frontend Origins (for CORS)
CLIENT_URL=https://placerise.netlify.app

# Staff Role Registration Authorization Keys
AUTH_KEY_PLACEMENT_OFFICER=OFFICER@PLACERISE2026
AUTH_KEY_CLASS_INCHARGE=INCHARGE@PLACERISE2026
AUTH_KEY_FACULTY=FACULTY@PLACERISE2026
```

### Client Configuration (`client/.env`)
Create `client/.env` with the following variables:

```env
# API Base URL (proxied locally through /api in Vite dev server)
VITE_API_BASE_URL=/api

# Backend Host URL
VITE_API_SERVER_URL=http://localhost:5000

# Application Branding
VITE_APP_NAME=Placerise
```

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js**: v18.x or later
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

### 2. Install Dependencies

In the root directory, install dependencies for both client and server:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start Development Servers

Run the backend and frontend development servers in separate terminals:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Client running at http://localhost:5173
```

---

## 🛠️ Database & Maintenance Utility Scripts

The server provides built-in utility scripts for database management:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Status Check** | `npx tsx src/seed/statusCheck.ts` | Inspects document counts across all collections and lists active users in the database. |
| **Data Cleanup** | `npm run cleanup` | Safely removes sample data and demo records while preserving production administrative accounts. |
| **Cloud Migration** | `npm run migrate:cloud` | Migrates institutional structure (`departments`, `academicyears`, `batches`, `classsections`, `trainingcategories`, `systemsettings`) from local MongoDB to MongoDB Atlas. |

---

## 🌐 Production Deployment

### Frontend (Netlify)
1. Build the production client bundle:
   ```bash
   cd client
   npm run build
   ```
2. The output directory is `client/dist`.
3. **Manual Upload**: Drag and drop `client/dist` directly into [Netlify Drop](https://app.netlify.com/drop).
4. **Git CI/CD**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - Set environment variable: `VITE_API_BASE_URL=https://your-backend-domain.com/api`

### Backend (Render / Railway / VPS)
1. Deploy the `server` directory to a Node.js hosting platform.
2. Set `NODE_ENV=production` and configure all environment variables from `server/.env`.
3. Start command: `npm start` (or `node dist/server.js` after `npm run build`).
4. Update `CLIENT_URL` to your live frontend domain (`https://placerise.netlify.app`).

---

## 📄 License

This project is proprietary institutional software developed for placement training cells and academic institutions.
