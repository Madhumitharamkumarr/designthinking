# ProjectFlow System Improvements Guide

## Practical enhancements to your existing system (NOT a redesign)

---

## 📋 Current System Analysis

### What You Have (Good Foundation ✅)

- ✅ Clean separation of concerns (models, controllers, middleware)
- ✅ Basic RBAC with role middleware
- ✅ Core entities (Event, Project, Stage, Submission) modeled well
- ✅ JWT-based authentication
- ✅ Role-filtered queries (students see own projects, coordinators see own events)

### Issues to Fix (Critical ⚠️)

#### Issue 1: Mentors Can't Review Submissions

```javascript
// Current: submissionRoutes.js
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin"),
  reviewSubmission,
);
//                          ☝️ Only coordinators and admins can review - WRONG!
```

**Problem**: Mentors should be able to review submissions  
**Impact**: Coordinators have to do all the review work

---

#### Issue 2: No Context-Aware Authorization

```javascript
// Current: submissionController.js
const reviewSubmission = async (req, res) => {
  // No check: Is this mentor assigned to this event?
  // Just checks if user role is 'coordinator' or 'admin'
  // Mentor from Event A could review Event B's submissions
};
```

**Problem**: Authorization is global, not contextual  
**Impact**: Security issue - mentor can access unauthorized data

---

#### Issue 3: Can't Support Multi-Role Users

```javascript
// User model has single role
role: {
  type: String,
  enum: ['admin', 'coordinator', 'mentor', 'student'],
  default: 'student',
}
// Can't make someone both 'coordinator' AND 'mentor'
```

**Problem**: Prof. Sharma can't coordinate AND mentor  
**Impact**: Unrealistic for real competitions

---

#### Issue 4: No Track/Specialization Support

```javascript
// Mentors are just listed in event.mentorIds
mentorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

// No way to say:
// - Mentor A specializes in "AI/ML"
// - Mentor B specializes in "Web Dev"
// - Mentor C is a "Judge", not a "Reviewer"
```

**Problem**: Can't model real mentoring structures  
**Impact**: Limited real-world applicability

---

#### Issue 5: Submission Review Missing Mentor Assignment Check

```javascript
// Current: submissionController.js
const reviewSubmission = async (req, res) => {
  const { feedback, status } = req.body;

  // Does NOT verify:
  // - Is user assigned as mentor to this event?
  // - Is user assigned to this specific project?
  // - Can user review at this stage?

  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    { feedback, status, reviewedBy: req.user._id },
    { new: true },
  );
  res.json(submission);
};
```

**Problem**: No validation that mentor can review this submission  
**Impact**: Wrong person might review wrong submission

---

#### Issue 6: No Deadline Enforcement

```javascript
// Stages have deadlines but not enforced
stageName: { type: String, enum: ['Idea', 'Prototype', 'Final'], required: true },
deadline: { type: Date, required: true },
// ☝️ Never checked when creating submission
```

**Problem**: Students can submit after deadline  
**Impact**: Unfair competition

---

#### Issue 7: Single Submission Per Stage (Silent Overwrite)

```javascript
// Current: submissionController.js - CREATE SUBMISSION
const existing = await Submission.findOne({ projectId, stageId });
if (existing) {
  // Silently overwrites previous submission
  existing.fileUrl = fileUrl || existing.fileUrl;
  // ☝️ No version history, no audit trail
  await existing.save();
}
```

**Problem**: Can't track submission history  
**Impact**: Can't see if students improve between resubmissions

---

#### Issue 8: No Feedback Status Management

```javascript
// Submission status only has: pending | approved | rejected
// Missing: 'reviewing' state
// No way to track: "Mentor started review" → "Pending feedback" → "Feedback given"
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending',
}
```

**Problem**: Can't track review lifecycle  
**Impact**: Dashboard doesn't show "under review" status

---

#### Issue 9: No Event Access Control

```javascript
// Current: eventController.js
const getEvent = async (req, res) => {
  const event = await Event.findById(req.params.id); // ← No access control!
  res.json(event);
};
```

**Problem**: Anyone can view any event details  
**Impact**: Private event info might be exposed

---

#### Issue 10: Missing Audit Trail

```javascript
// No tracking of:
// - Who assigned this mentor?
// - When was the role assigned?
// - When did the coordinator approve a submission?
// - What feedback was given?
```

**Problem**: No audit trail for admin/compliance  
**Impact**: Can't track who did what when

---

## 🔧 Targeted Improvements (Incremental)

### Improvement 1: Enable Mentors to Review Submissions

**Step 1A: Fix Route** (submissionRoutes.js)

```javascript
// BEFORE
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin"),
  reviewSubmission,
);

// AFTER - Add 'mentor' to allowed roles
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin", "mentor"),
  reviewSubmission,
);
```

**Step 1B: Add Authorization Check in Controller** (submissionController.js)

```javascript
const reviewSubmission = async (req, res) => {
  try {
    const { feedback, status } = req.body;
    const submissionId = req.params.id;

    // Fetch the submission with all related data
    const submission = await Submission.findById(submissionId)
      .populate({ path: "projectId", populate: { path: "eventId" } })
      .populate("stageId");

    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    // Authorization: Check if user can review this submission
    const canReview = await canUserReviewSubmission(req.user, submission);
    if (!canReview) {
      return res.status(403).json({
        message: "You are not authorized to review this submission",
      });
    }

    // Check deadline hasn't passed (if needed)
    if (new Date() > submission.stageId.deadline) {
      console.warn(
        `Submission review after deadline for stage ${submission.stageId._id}`,
      );
      // You can warn but allow, or block depending on your rules
    }

    // Update submission
    submission.feedback = feedback;
    submission.status = status; // 'approved' or 'rejected'
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check if user can review
const canUserReviewSubmission = async (user, submission) => {
  // Admins can review anything
  if (user.role === "admin") return true;

  // Coordinators can review their event's submissions
  if (user.role === "coordinator") {
    const event = submission.projectId.eventId;
    return event.coordinatorId.toString() === user._id.toString();
  }

  // Mentors can review only if assigned to this event
  if (user.role === "mentor") {
    const event = submission.projectId.eventId;
    return event.mentorIds.includes(user._id);
  }

  return false;
};

module.exports = {
  createSubmission,
  getSubmissions,
  reviewSubmission,
  getSubmission,
  canUserReviewSubmission, // Export for reuse
};
```

**Result**: ✅ Mentors can now review submissions they're assigned to  
**Breaking Change**: ❌ None - just adds functionality

---

### Improvement 2: Add Event-Level Access Control

**Add authorization check to getEvent** (eventController.js)

```javascript
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("coordinatorId", "name email")
      .populate("mentorIds", "name email")
      .populate("createdBy", "name email");

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization: Who can view this event?
    const canView =
      req.user.role === "admin" || // Admins see all
      event.coordinatorId._id.toString() === req.user._id || // Coordinator sees own
      event.mentorIds.some((m) => m._id.toString() === req.user._id) || // Mentors see assigned
      event.createdBy._id.toString() === req.user._id; // Creator sees own

    if (!canView) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this event" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Result**: ✅ Event details are access-controlled  
**Breaking Change**: ❌ None - just adds security

---

### Improvement 3: Add Submission Status for "Under Review"

**Update Submission Model** (models/Submission.js)

```javascript
// BEFORE
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending',
}

// AFTER - Add 'reviewing' state
status: {
  type: String,
  enum: ['pending', 'reviewing', 'approved', 'rejected'],
  default: 'pending',
},

// ADD: Track review timestamps
reviewStartedAt: { type: Date, default: null },
reviewedAt: { type: Date, default: null },
```

**Update reviewSubmission** to set status = 'reviewing' when mentor starts

```javascript
// When mentor starts review:
submission.status = "reviewing";
submission.reviewStartedAt = new Date();
await submission.save();

// When mentor completes:
submission.status = status; // 'approved' or 'rejected'
submission.reviewedAt = new Date();
await submission.save();
```

**Result**: ✅ Dashboard can show "under review" status  
**Breaking Change**: ⚠️ Minimal - adds new status option, old queries still work

---

### Improvement 4: Enforce Submission Deadlines

**Add deadline check in createSubmission** (submissionController.js)

```javascript
const createSubmission = async (req, res) => {
  try {
    const { projectId, stageId, fileUrl, fileName, notes } = req.body;

    // Get stage and check deadline
    const stage = await Stage.findById(stageId);
    if (!stage) return res.status(404).json({ message: "Stage not found" });

    // Check if deadline has passed
    if (new Date() > stage.deadline) {
      return res.status(400).json({
        message: `Deadline for ${stage.stageName} stage has passed (${stage.deadline.toISOString()})`,
        deadline: stage.deadline,
      });
    }

    // ... rest of existing logic
    const project = await Project.findById(projectId);
    // ... validation continues
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Result**: ✅ Students can't submit after deadline  
**Breaking Change**: ❌ None - just enforces business rule

---

### Improvement 5: Add Submission Version History

**Create new SubmissionHistory Model** (models/SubmissionHistory.js)

```javascript
const mongoose = require("mongoose");

const submissionHistorySchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },
    fileUrl: { type: String },
    fileName: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewing", "approved", "rejected"],
    },
    feedback: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Version tracking
    versionNumber: { type: Number },
    changeReason: { type: String }, // 'resubmit', 'review', 'approve', etc.
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

submissionHistorySchema.index({ submissionId: 1, versionNumber: -1 });

module.exports = mongoose.model("SubmissionHistory", submissionHistorySchema);
```

**Update createSubmission to track versions** (submissionController.js)

```javascript
const SubmissionHistory = require("../models/SubmissionHistory");

const createSubmission = async (req, res) => {
  try {
    const { projectId, stageId, fileUrl, fileName, notes } = req.body;

    // ... validation ...

    // Check for existing submission
    let submission = await Submission.findOne({ projectId, stageId });
    let isResubmission = false;
    let versionNumber = 1;

    if (submission) {
      // Save current version to history
      const historyEntry = await SubmissionHistory.create({
        submissionId: submission._id,
        projectId: submission.projectId,
        stageId: submission.stageId,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        notes: submission.notes,
        status: submission.status,
        feedback: submission.feedback,
        reviewedBy: submission.reviewedBy,
        versionNumber: submission.versionNumber || 1,
        changeReason: "resubmit",
        changedBy: req.user._id,
      });

      // Increment version
      versionNumber = (submission.versionNumber || 1) + 1;
      isResubmission = true;

      // Update with new submission
      submission.fileUrl = fileUrl || submission.fileUrl;
      submission.fileName = fileName || submission.fileName;
      submission.notes = notes || submission.notes;
      submission.status = "pending";
      submission.feedback = "";
      submission.reviewedBy = null;
      submission.versionNumber = versionNumber;
      submission.submittedAt = new Date();

      await submission.save();
    } else {
      // New submission
      submission = await Submission.create({
        projectId,
        stageId,
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        notes: notes || "",
        versionNumber: 1,
        submittedAt: new Date(),
      });
    }

    res.status(isResubmission ? 200 : 201).json({
      submission,
      versionNumber,
      isResubmission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Add endpoint to get submission history** (submissionController.js)

```javascript
const getSubmissionHistory = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const history = await SubmissionHistory.find({ submissionId })
      .populate("changedBy", "name email role")
      .populate("reviewedBy", "name email")
      .sort({ versionNumber: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  reviewSubmission,
  getSubmissionHistory,
  canUserReviewSubmission,
};
```

**Add route** (submissionRoutes.js)

```javascript
router.get("/:submissionId/history", protect, getSubmissionHistory);
```

**Result**: ✅ Can track all submission versions and changes  
**Breaking Change**: ❌ None - adds new feature, no schema change to Submission required (yet)

---

### Improvement 6: Better Authorization Middleware

**Create contextual authorization helper** (middleware/authorization.js)

```javascript
// middleware/authorization.js
const Event = require("../models/Event");
const Project = require("../models/Project");

// Check if user can act on specific event
const canAccessEvent = async (user, eventId) => {
  const event = await Event.findById(eventId);
  if (!event) return false;

  if (user.role === "admin") return true;
  if (event.coordinatorId.toString() === user._id.toString()) return true;
  if (event.mentorIds.some((m) => m.toString() === user._id.toString()))
    return true;

  return false;
};

// Check if user can access project
const canAccessProject = async (user, projectId) => {
  const project = await Project.findById(projectId).populate("eventId");
  if (!project) return false;

  if (user.role === "admin") return true;
  if (project.studentId.toString() === user._id.toString()) return true;

  // Check if mentor/coordinator of the event
  const event = project.eventId;
  if (event.coordinatorId.toString() === user._id.toString()) return true;
  if (event.mentorIds.some((m) => m.toString() === user._id.toString()))
    return true;

  return false;
};

// Middleware factory
const requireEventAccess = (paramName = "eventId") => {
  return async (req, res, next) => {
    const eventId = req.params[paramName] || req.body.eventId;
    const canAccess = await canAccessEvent(req.user, eventId);

    if (!canAccess) {
      return res.status(403).json({ message: "Not authorized for this event" });
    }

    next();
  };
};

const requireProjectAccess = (paramName = "projectId") => {
  return async (req, res, next) => {
    const projectId = req.params[paramName] || req.body.projectId;
    const canAccess = await canAccessProject(req.user, projectId);

    if (!canAccess) {
      return res
        .status(403)
        .json({ message: "Not authorized for this project" });
    }

    next();
  };
};

module.exports = {
  canAccessEvent,
  canAccessProject,
  requireEventAccess,
  requireProjectAccess,
};
```

**Use in routes** (submissionRoutes.js)

```javascript
const { requireProjectAccess } = require("../middleware/authorization");

// GET submissions for a project
router.get(
  "/:projectId",
  protect,
  requireProjectAccess("projectId"),
  getSubmissions,
);

// REVIEW a submission
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin", "mentor"),
  async (req, res, next) => {
    // Get submission and check project access
    const submission = await Submission.findById(req.params.id).populate(
      "projectId",
    );
    const canAccess = await requireProjectAccess("projectId")(req, res, next);

    if (canAccess) next();
  },
  reviewSubmission,
);
```

**Result**: ✅ Reusable authorization checks across controllers  
**Breaking Change**: ❌ None - just better organization

---

### Improvement 7: Add Submission Fields for Better Tracking

**Update Submission Model** (models/Submission.js)

```javascript
const submissionSchema = new mongoose.Schema(
  {
    projectId: {
      /* existing */
    },
    stageId: {
      /* existing */
    },
    fileUrl: {
      /* existing */
    },
    fileName: {
      /* existing */
    },
    notes: {
      /* existing */
    },
    status: {
      /* existing + 'reviewing' */
    },
    feedback: {
      /* existing */
    },
    reviewedBy: {
      /* existing */
    },

    // NEW FIELDS for better tracking
    versionNumber: { type: Number, default: 1 },
    submittedAt: { type: Date, default: Date.now },
    reviewStartedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    resubmissionReason: { type: String, default: "" }, // Why resubmitted?

    // Metadata
    studentNotes: { type: String, default: "" }, // Student's explanation
    mentorNotes: { type: String, default: "" }, // Mentor's internal notes
  },
  { timestamps: true },
);

submissionSchema.index({ projectId: 1, stageId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ reviewedBy: 1 });
submissionSchema.index({ createdAt: -1 });
```

**Result**: ✅ Better tracking and audit trail  
**Breaking Change**: ⚠️ Schema change, but backward compatible (new fields are optional)

---

### Improvement 8: Add Request Logging for Audit Trail

**Create auditLog middleware** (middleware/auditLog.js)

```javascript
const AuditLog = require("../models/AuditLog");

const auditLog = async (req, res, next) => {
  // Capture original response.json
  const originalJson = res.json;

  res.json = function (data) {
    // Log successful requests
    if (res.statusCode < 400 && req.method !== "GET") {
      AuditLog.create({
        userId: req.user?._id,
        action: `${req.method} ${req.originalUrl}`,
        resource: req.params.id || req.body?.id,
        changes: req.body,
        status: res.statusCode,
        ip: req.ip,
      }).catch((err) => console.error("Audit log error:", err));
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = { auditLog };
```

**Create AuditLog Model** (models/AuditLog.js)

```javascript
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String, // e.g., "PATCH /api/submissions/123/review"
  resource: String, // What was modified
  changes: mongoose.Schema.Types.Mixed, // What changed
  status: Number, // HTTP status
  ip: String,
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
```

**Use in server.js**

```javascript
const { auditLog } = require("./middleware/auditLog");

app.use(auditLog); // Add after auth middleware
```

**Result**: ✅ Admin can audit who did what when  
**Breaking Change**: ❌ None - optional logging

---

### Improvement 9: Add Real-Time Notifications with WebSockets (Optional)

**Create notification service** (services/notificationService.js)

```javascript
const io = require("socket.io")(server);

const notifySubmissionReviewed = (submissionId, studentId, status) => {
  io.to(`user_${studentId}`).emit("submission:reviewed", {
    submissionId,
    status, // 'approved' or 'rejected'
    timestamp: new Date(),
  });
};

const notifyMentorAssigned = (mentorId, eventId) => {
  io.to(`user_${mentorId}`).emit("mentor:assigned", {
    eventId,
    message: "You have been assigned as a mentor",
    timestamp: new Date(),
  });
};

const notifyReviewRequested = (mentorId, submissionId) => {
  io.to(`user_${mentorId}`).emit("review:requested", {
    submissionId,
    message: "New submission pending review",
    timestamp: new Date(),
  });
};

module.exports = {
  notifySubmissionReviewed,
  notifyMentorAssigned,
  notifyReviewRequested,
};
```

**Emit notifications in controller** (submissionController.js)

```javascript
const { notifySubmissionReviewed } = require("../services/notificationService");

const reviewSubmission = async (req, res) => {
  // ... existing logic ...

  // Notify student
  notifySubmissionReviewed(
    submission._id,
    submission.projectId.studentId,
    status,
  );

  res.json(submission);
};
```

**Result**: ✅ Students get real-time feedback notifications  
**Breaking Change**: ❌ None - optional feature

---

## 📊 Implementation Priority (Recommended Order)

### Phase 1: Critical Fixes (Week 1) ⭐⭐⭐

1. **Improvement 1**: Enable mentors to review (10 min fix)
2. **Improvement 3**: Add "reviewing" status (5 min update)
3. **Improvement 4**: Enforce submission deadlines (15 min)

### Phase 2: Security & Access Control (Week 2) ⭐⭐

4. **Improvement 2**: Event-level access control (20 min)
5. **Improvement 6**: Better authorization middleware (30 min)
6. **Improvement 7**: Better submission tracking fields (10 min)

### Phase 3: Audit & Tracking (Week 3) ⭐

7. **Improvement 5**: Submission version history (45 min)
8. **Improvement 8**: Audit logging (20 min)

### Phase 4: Real-Time (Week 4) ⭐

9. **Improvement 9**: WebSocket notifications (1 hour)

---

## 🔄 Database Schema Updates Summary

### Updated Models (Minimal Changes)

```javascript
// User.js - NO CHANGE (keep single role for now)
// Add multi-role later if needed

// Submission.js - ADD FIELDS
status: "pending | reviewing | approved | rejected"; // Add 'reviewing'
versionNumber: Number;
submittedAt: Date;
reviewStartedAt: Date;
reviewedAt: Date;
resubmissionReason: String;
studentNotes: String;
mentorNotes: String;

// NEW: SubmissionHistory.js
// Track all versions of submissions

// NEW: AuditLog.js
// Track all admin actions
```

### New Collections

```
- SubmissionHistory (tracks versions)
- AuditLog (tracks admin actions)
```

---

## 🧪 Testing Scenarios After Improvements

### Scenario 1: Mentor Reviews Assignment

```
1. Admin creates event "TechFest 2026"
2. Admin assigns Prof. Sharma as coordinator
3. Prof. Sharma creates stages
4. Prof. Sharma adds Mentor John for event
5. Student submits project for Idea stage
6. Mentor John reviews submission ✅ NOW WORKS
7. John sees status changed, student gets real-time notification ✅
```

### Scenario 2: Deadline Enforcement

```
1. Idea stage deadline: May 20, 2026
2. Student tries to submit on May 21 → ❌ ERROR: Deadline passed
3. Admin can force override if needed (future enhancement)
```

### Scenario 3: Submission History

```
1. Student submits v1 (Pending review)
2. Mentor gives feedback → Rejected
3. Student resubmits v2 (Pending review)
4. Mentor approves
5. Admin can see: v1 → Rejected, v2 → Approved
6. Full audit trail of changes
```

### Scenario 4: Access Control

```
1. Mentor A assigned to Event X
2. Mentor A tries to access Event Y submissions → ❌ Forbidden
3. Coordinator of Event Y access → ✅ Allowed
4. Admin access → ✅ Allowed
```

---

## 📋 Implementation Checklist

### Phase 1 (Critical) - Day 1-2

- [ ] Update Submission model to add 'reviewing' status
- [ ] Update Submission model to add tracking fields
- [ ] Update submissionRoutes: Add 'mentor' to review endpoint
- [ ] Add authorization check in reviewSubmission controller
- [ ] Add deadline enforcement in createSubmission
- [ ] Test mentor review flow

### Phase 2 (Security) - Day 3-4

- [ ] Create authorization.js middleware
- [ ] Add event access control in getEvent
- [ ] Add project access control in project controller
- [ ] Update routes to use authorization middleware
- [ ] Test access control scenarios

### Phase 3 (Tracking) - Day 5-6

- [ ] Create SubmissionHistory model
- [ ] Update createSubmission to save to history
- [ ] Add getSubmissionHistory endpoint
- [ ] Add getSubmissionHistory route
- [ ] Create AuditLog model
- [ ] Add auditLog middleware

### Phase 4 (Real-Time) - Day 7

- [ ] Install socket.io
- [ ] Create notification service
- [ ] Add WebSocket event listeners
- [ ] Emit notifications from controllers
- [ ] Test real-time notifications

---

## 🚀 Quick Start: Do These 3 Things Today

### 1. Fix Mentor Review Route (5 minutes)

File: `server/routes/submissionRoutes.js`

```javascript
// Change this line:
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin"),
  reviewSubmission,
);

// To this:
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin", "mentor"),
  reviewSubmission,
);
```

### 2. Add Authorization Check (10 minutes)

File: `server/controllers/submissionController.js`

```javascript
// Add this function at the end:
const canUserReviewSubmission = async (user, submission) => {
  if (user.role === "admin") return true;
  if (user.role === "coordinator") {
    const event = submission.projectId.eventId;
    return event.coordinatorId.toString() === user._id.toString();
  }
  if (user.role === "mentor") {
    const event = submission.projectId.eventId;
    return event.mentorIds.includes(user._id);
  }
  return false;
};

// Add this check in reviewSubmission:
const canReview = await canUserReviewSubmission(req.user, submission);
if (!canReview) {
  return res.status(403).json({
    message: "You are not authorized to review this submission",
  });
}
```

### 3. Enforce Deadlines (10 minutes)

File: `server/controllers/submissionController.js`

```javascript
// Add this in createSubmission before creating submission:
const stage = await Stage.findById(stageId);
if (!stage) return res.status(404).json({ message: "Stage not found" });

if (new Date() > stage.deadline) {
  return res.status(400).json({
    message: `Deadline for ${stage.stageName} stage has passed`,
    deadline: stage.deadline,
  });
}
```

**Total Time: 25 minutes** → Your system is already more secure and realistic! ✅

---

## 📚 Next Steps

After implementing these improvements:

1. **Consider Multi-Role Support** (Intermediate)
   - Add separate `UserRole` collection
   - Enable Prof. Sharma to be coordinator + mentor

2. **Add Track/Specialization** (Advanced)
   - Add tracks to Event model
   - Assign mentors to specific tracks
   - Route projects to track mentors

3. **Add Real-Time Dashboard** (Advanced)
   - Socket.io for live updates
   - Show "under review" status
   - Show mentor notifications

4. **Advanced Features** (Production)
   - Role expiry/time-based roles
   - Permission inheritance
   - Fine-grained access control

---

## 🎯 Summary

**Your system is good, but needs these fixes:**

| Issue                   | Fix                            | Time   | Priority |
| ----------------------- | ------------------------------ | ------ | -------- |
| Mentors can't review    | Add to route + auth check      | 10 min | ⭐⭐⭐   |
| No access control       | Context-aware middleware       | 20 min | ⭐⭐     |
| No deadline enforcement | Check deadline in submission   | 10 min | ⭐⭐⭐   |
| No submission history   | Create SubmissionHistory model | 45 min | ⭐⭐     |
| No audit trail          | Create AuditLog model          | 20 min | ⭐       |
| No real-time feedback   | WebSockets + notifications     | 1 hour | ⭐       |

**Keep your existing architecture** - these are additive improvements, not redesigns! ✅
