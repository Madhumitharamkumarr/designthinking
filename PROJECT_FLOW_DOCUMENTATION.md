# ProjectFlow - Complete Project Documentation

## 📋 Project Overview

**ProjectFlow** is an **academic project management system** that streamlines multi-stage submission workflows for competitive events like:

- Hackathons
- Ideathons
- Mini-projects
- Competitions

It enables institutions to organize events with structured stages, manage student projects, facilitate mentor reviews, and track project progression through defined milestones.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectFlow System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  React Frontend  │◄────►│  Express Server  │             │
│  │   (Port 5173)    │      │   (Port 5000)    │             │
│  │                  │      │                  │             │
│  │  • Pages         │      │  • Auth Routes   │             │
│  │  • Components    │      │  • Event Routes  │             │
│  │  • Services      │      │  • Project APIs  │             │
│  │  • Context       │      │  • Submission    │             │
│  │                  │      │  • Upload        │             │
│  └──────────────────┘      └────────┬─────────┘             │
│         ▲                           │                        │
│         │                           ▼                        │
│         │                  ┌──────────────────┐             │
│         │                  │    MongoDB       │             │
│         │                  │  Collections:    │             │
│         │                  │  • Users         │             │
│         │                  │  • Events        │             │
│         │                  │  • Projects      │             │
│         │                  │  • Stages        │             │
│         │                  │  • Submissions   │             │
│         │                  └──────────────────┘             │
│         │                                                    │
│         └───────────────────────────────────────────────────┘
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐
│  │           Cloudinary (File Storage)                       │
│  │         • Project submissions                             │
│  │         • Project attachments                             │
│  └──────────────────────────────────────────────────────────┘
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

```
Backend:
  • Node.js + Express.js
  • MongoDB + Mongoose (ODM)
  • JWT Authentication (7-day expiry)
  • bcryptjs for password hashing
  • Nodemon for development

Frontend:
  • React 18
  • Vite (build tool)
  • React Router v6
  • Axios for HTTP calls
  • React Hot Toast for notifications
  • CSS for styling
```

---

## 📊 Data Models & Relationships

### 1. **User Model**

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypted),
  role: "admin" | "coordinator" | "mentor" | "student",
  createdAt: Date,
  updatedAt: Date
}
```

**Roles & Permissions:**
| Role | Permissions |
|------|-------------|
| **Admin** | Create/edit events, create stages, manage all users |
| **Coordinator** | Create/edit own events, create stages for own events |
| **Mentor** | Review submissions for assigned events |
| **Student** | Create projects, submit work, view feedback |

### 2. **Event Model**

```javascript
{
  _id: ObjectId,
  title: String,
  type: "hackathon" | "ideathon" | "mini-project" | "other",
  description: String,
  coordinatorId: ObjectId (ref: User),
  mentorIds: [ObjectId] (refs: User),
  createdBy: ObjectId (ref: User),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Stage Model**

```javascript
{
  _id: ObjectId,
  eventId: ObjectId (ref: Event),
  stageName: "Idea" | "Prototype" | "Final",
  order: Number (1, 2, or 3),
  deadline: Date,
  instructions: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Project Model**

```javascript
{
  _id: ObjectId,
  projectTitle: String,
  description: String,
  studentId: ObjectId (ref: User),
  eventId: ObjectId (ref: Event),
  teamMembers: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Constraint:** Unique combination of `{studentId, eventId}` - one project per student per event

### 5. **Submission Model**

```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project),
  stageId: ObjectId (ref: Stage),
  fileUrl: String (Cloudinary URL),
  fileName: String,
  notes: String,
  status: "pending" | "approved" | "rejected",
  feedback: String,
  reviewedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Data Relationship Diagram

```
┌──────────┐
│   User   │
└──────────┘
     ▲
     │ (coordinator/mentor/student)
     │
┌────┴─────┐
│  Event   │◄───────────── Created by User
└────┬─────┘
     │
     │ contains 3
     ▼
┌─────────┐
│  Stage  │  (Idea, Prototype, Final)
└─────────┘
     ▲
     │ belongs to
     │
┌────────────────┐
│  Project       │◄───────── Created by Student (User)
└────┬───────────┘
     │
     │ has 1-3
     ▼
┌──────────────┐
│ Submission   │◄────────── For each Stage
└──────────────┘           Reviewed by Mentor (User)
```

---

## 🔐 Authentication & Authorization Flow

### Authentication Process

```
1. User Registration/Login
   ├─ POST /api/auth/register
   ├─ POST /api/auth/login
   └─ Server returns: { token, user }

2. Token Storage (Frontend)
   ├─ localStorage: "pf_token" = JWT
   └─ localStorage: "pf_user" = User data

3. Request Headers
   ├─ All requests include: "Authorization: Bearer {token}"
   └─ Axios interceptor handles this automatically

4. Backend Verification
   ├─ middleware/auth.js extracts & verifies token
   ├─ Decodes JWT using JWT_SECRET
   ├─ Loads user from DB
   └─ Attaches user to req.user

5. Token Expiry
   ├─ JWT expires in 7 days
   ├─ 401 response triggers frontend logout
   └─ User redirected to /login
```

### Authorization (Role-Based Access Control)

```
Frontend Guards:
  ├─ ProtectedRoute: Requires authentication
  └─ RoleRoute: Requires specific role(s)

Backend Middleware:
  ├─ middleware/auth.js: Verify JWT token
  └─ middleware/roles.js: Check user.role against route requirements

Example:
  POST /api/events (admin only)
    ├─ Request hits auth middleware
    ├─ Checks if user.role === "admin"
    ├─ If yes → proceed
    └─ If no → 403 Forbidden
```

---

## 👥 User Workflows

### Workflow 1: Event Setup (Admin/Coordinator)

```
ADMIN
  └─ POST /api/events (create event)
     ├─ Provide: title, type, description
     ├─ Select: coordinator, mentors
     └─ Event created with isActive = false

COORDINATOR (of that event)
  └─ Creates 3 Stages
     ├─ Stage 1: "Idea" (deadline: Day 1)
     ├─ Stage 2: "Prototype" (deadline: Day 3)
     └─ Stage 3: "Final" (deadline: Day 5)

  └─ Publishes event (isActive = true)
```

### Workflow 2: Student Participation

```
STUDENT
  ├─ Browse /events (sees active events)
  ├─ View /events/:id (event details with stages)
  │
  ├─ Create Project (/projects)
  │  ├─ One project per event only
  │  └─ Provide: title, description, team members
  │
  ├─ For Each Stage:
  │  ├─ Upload file + notes
  │  ├─ POST /api/submissions
  │  ├─ Status = "pending"
  │  └─ Wait for mentor review
  │
  ├─ Mentor Reviews
  │  └─ PATCH /api/submissions/:id
  │     ├─ Sets status: "approved" or "rejected"
  │     ├─ Adds feedback
  │     └─ Student can see feedback on Submissions page
  │
  └─ If Rejected:
     └─ Resubmit file with improvements
        (Can resubmit unlimited times)
```

### Workflow 3: Mentor Review

```
MENTOR
  ├─ See /events (shows assigned events only)
  ├─ View /projects (shows projects from assigned events)
  │
  ├─ Click Project
  │  └─ See all submissions for this project
  │
  ├─ Review Each Submission
  │  ├─ Download file
  │  ├─ Provide feedback
  │  ├─ Set status: "approved" or "rejected"
  │  └─ Save (PATCH /api/submissions/:id)
  │
  └─ Repeat for all projects in assigned events
```

### Workflow 4: Dashboard View

```
STUDENT Dashboard
  ├─ Participating Events (list)
  ├─ My Projects (with stage progress)
  │  ├─ Stage progress bar showing: Idea → Prototype → Final
  │  └─ Green = approved, Red = rejected, Yellow = pending
  └─ Recent Submissions & Feedback

MENTOR Dashboard
  ├─ Assigned Events
  ├─ Projects to Review
  └─ Pending Submissions (sorted by deadline)

COORDINATOR Dashboard
  ├─ My Events
  ├─ Event Statistics
  ├─ Stages & Deadlines
  └─ All Projects & Submissions (for their events)

ADMIN Dashboard
  ├─ All Events
  ├─ All Projects
  ├─ User Management
  └─ System Statistics
```

---

## 🔗 API Endpoints Summary

### Authentication (`/api/auth`)

```
POST   /register          → Create new user account
POST   /login             → Get JWT token
GET    /me                → Get current logged-in user
GET    /users             → List all users (admin only)
```

### Events (`/api/events`)

```
POST   /                  → Create event (admin)
GET    /                  → List events (filtered by role)
GET    /:id               → Get event details
PUT    /:id               → Update event (admin)
DELETE /:id               → Delete event (admin)
```

### Stages (`/api/stages`)

```
POST   /                  → Create stage (coordinator)
GET    /:eventId          → Get all stages for event
PUT    /:id               → Update stage
DELETE /:id               → Delete stage
```

### Projects (`/api/projects`)

```
POST   /                  → Create project (student)
GET    /                  → List projects (filtered by role)
GET    /:id               → Get project details
PUT    /:id               → Update project (owner/admin)
DELETE /:id               → Delete project
```

### Submissions (`/api/submissions`)

```
POST   /                  → Create/submit work (student)
GET    /                  → List submissions (filtered by role)
PATCH  /:id               → Review & provide feedback (mentor/coordinator)
```

### Upload (`/api/upload`)

```
POST   /                  → Upload file to Cloudinary
```

---

## 🛠️ Middleware & Security

### Authentication Middleware (`middleware/auth.js`)

```
Function: verify()
  ├─ Extract JWT from "Authorization: Bearer {token}"
  ├─ Verify token signature
  ├─ Decode to get user ID
  ├─ Fetch user from DB
  ├─ Attach user to req.user
  └─ If invalid/expired → 401 response
```

### Role-Based Access Control (`middleware/roles.js`)

```
Function: checkRole(...allowedRoles)
  ├─ Check req.user.role
  ├─ If role in allowedRoles → next()
  └─ If not → 403 Forbidden
```

### Password Security

```
Registration:
  ├─ User provides password
  ├─ Hash using bcryptjs (rounds: 10)
  └─ Store hashed password in DB

Login:
  ├─ User provides password
  ├─ Compare with hashed version using bcryptjs
  ├─ If match → generate JWT
  └─ If not → 401 Unauthorized
```

---

## 📁 Frontend Page Structure

```
/
├─ Login (/login)              → User authentication
├─ Register (/register)        → Create new account
│
├─ Dashboard (/)               → Home page (role-specific views)
│
├─ Events (/events)            → Browse all events
├─ Event Details (/events/:id) → View event & stages
│
├─ Projects (/projects)        → Browse projects
├─ Project Details (/projects/:id) → View project & submissions
├─ Create Project (/projects/create) → Create new project
│
├─ Submissions (/submissions)  → View all submissions
│
└─ Create Event (/events/create) → Create event (admin)
```

---

## 🚀 Key Features

### For Students

- ✅ Browse and join events
- ✅ Create one project per event
- ✅ Submit work at each stage with file upload
- ✅ Track submission status (pending/approved/rejected)
- ✅ View mentor feedback and resubmit if needed
- ✅ See visual progress bar of stages

### For Mentors

- ✅ Review submissions for assigned events only
- ✅ Provide detailed feedback
- ✅ Approve or reject submissions
- ✅ Track review progress

### For Coordinators

- ✅ Create and manage events
- ✅ Define stages with deadlines and instructions
- ✅ Assign mentors to events
- ✅ View all submissions and project statistics

### For Admins

- ✅ Full system access
- ✅ Create events and coordinators
- ✅ User management
- ✅ System-wide analytics

---

## 🎯 Key Constraints & Business Logic

1. **One Project Per Student Per Event**
   - Database constraint: unique `{studentId, eventId}`
   - Prevents duplicate projects

2. **Sequential Stages**
   - Every event has exactly 3 stages
   - Stages are in order: Idea → Prototype → Final
   - Each has a deadline

3. **Submission Re-submission**
   - If rejected, student can upload new file
   - Replaces previous submission
   - Mentor can review again

4. **Role-Based Visibility**
   - Students see only their projects/submissions
   - Mentors see projects from assigned events only
   - Coordinators see projects from their events
   - Admins see everything

5. **Status Workflow**
   ```
   Submission Status Flow:
   pending ──(mentor review)──> approved ✓
          └──(mentor review)──> rejected ✗
                                   └──(resubmit)──> pending
   ```

---

## 💾 Environment Variables

### Server (`.env`)

```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
PORT=5000
NODE_ENV=development
```

### Client (`.env`)

```
VITE_API_URL=http://localhost:5000/api
```

---

## 🔄 Information Flow Example: Student Submitting Work

```
┌─────────────┐
│  Student    │
└──────┬──────┘
       │ 1. Opens /projects/:id page
       │ 2. Clicks "Submit for Idea Stage"
       ▼
┌──────────────────────┐
│  FileUpload Component │
│  └─ Select file      │
│  └─ Add notes        │
│  └─ Click Submit     │
└──────┬───────────────┘
       │ 3. Sends file to Cloudinary
       │ 4. Gets file URL back
       ▼
┌─────────────────────────────────────┐
│  POST /api/submissions              │
│  {                                  │
│    projectId: "...",                │
│    stageId: "...",                  │
│    fileUrl: "cloudinary-url",       │
│    fileName: "file.pdf",            │
│    notes: "Here's my work..."       │
│  }                                  │
└──────┬──────────────────────────────┘
       │ 5. Backend validates:
       │    - User is student
       │    - Project belongs to user
       │    - Stage exists
       │ 6. Creates Submission doc
       │ 7. Sets status = "pending"
       ▼
┌──────────────────────┐
│  Database: Submission│
│  (status: pending)   │
└──────┬───────────────┘
       │ 8. Returns success
       │ 9. Shows toast notification
       │ 10. Refreshes submissions list
       ▼
┌────────────────────────┐
│  Student sees on UI    │
│  "Pending Review"      │
│  (waiting for mentor)  │
└────────────────────────┘
       │
       │ [Time passes - Mentor reviews]
       │
       ▼
┌──────────────────────────────────────────┐
│  PATCH /api/submissions/:id              │
│  {                                       │
│    status: "approved" or "rejected",     │
│    feedback: "Great work!" or "Fix...",  │
│    reviewedBy: mentor-user-id            │
│  }                                       │
└──────┬───────────────────────────────────┘
       │ 11. Updates Submission doc
       │ 12. Backend notifies student
       ▼
┌─────────────────────────────────────┐
│  Student can see on UI              │
│  ✓ Approved + "Great work!"         │
│  OR                                 │
│  ✗ Rejected + "Fix the logic..."    │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Submission Flow

1. Admin creates event "HackFest 2026"
2. Coordinator creates 3 stages with deadlines
3. Student discovers event and creates project
4. Student submits work for "Idea" stage
5. Mentor reviews and approves
6. Student submits "Prototype" stage
7. Mentor reviews and requests changes
8. Student resubmits with improvements
9. Mentor approves
10. Student submits final work
11. Mentor approves - project complete

### Scenario 2: Role Isolation

1. Student A tries to access Student B's project → Blocked
2. Mentor X tries to review projects from Mentor Y's event → Blocked
3. Coordinator tries to create event → Blocked (needs admin)
4. Admin can access everything → Success

### Scenario 3: Deadline Tracking

1. Check stage deadlines are enforced
2. After deadline, new submissions not allowed
3. But reviews can still happen after deadline

---

## 🎓 Educational Value

This system teaches:

- Full-stack application development (MERN)
- User authentication & JWT
- Role-based access control (RBAC)
- RESTful API design
- Database modeling & relationships
- File upload handling
- Frontend state management
- Component-based architecture
- Secure password handling
