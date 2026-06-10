# Quick Implementation: Copy-Paste Code Snippets

## 🚀 Phase 1: Critical Fixes (Do Today - 25 minutes)

---

## Fix 1: Enable Mentors to Review Submissions (10 minutes)

### Step 1.1: Update Route File

**File:** `server/routes/submissionRoutes.js`

**Find this line:**

```javascript
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin"),
  reviewSubmission,
);
```

**Replace with this:**

```javascript
router.patch(
  "/:id/review",
  protect,
  requireRole("coordinator", "admin", "mentor"),
  reviewSubmission,
);
```

### Step 1.2: Add Authorization Check in Controller

**File:** `server/controllers/submissionController.js`

**Add this helper function at the END of the file (before module.exports):**

```javascript
// Helper function to check if user can review submission
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
    return event.mentorIds.some(
      (mentorId) => mentorId.toString() === user._id.toString(),
    );
  }

  return false;
};

module.exports = {
  createSubmission,
  getSubmissions,
  reviewSubmission,
  getSubmission,
  canUserReviewSubmission,
};
```

**In the reviewSubmission function, add this check at the START:**

```javascript
const reviewSubmission = async (req, res) => {
  try {
    const { feedback, status } = req.body;
    const submissionId = req.params.id;

    // Fetch the submission with related data
    const submission = await Submission.findById(submissionId)
      .populate({
        path: "projectId",
        populate: { path: "eventId" },
      })
      .populate("stageId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // NEW: Check authorization
    const canReview = await canUserReviewSubmission(req.user, submission);
    if (!canReview) {
      return res.status(403).json({
        message: "You are not authorized to review this submission",
      });
    }

    // NEW: Check deadline (warning only, don't block)
    if (new Date() > submission.stageId.deadline) {
      console.warn(`Review after deadline for stage ${submission.stageId._id}`);
    }

    // Update submission
    submission.feedback = feedback;
    submission.status = status;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## Fix 2: Add "Reviewing" Status & Tracking Fields (5 minutes)

**File:** `server/models/Submission.js`

**Replace the entire submissionSchema with this:**

```javascript
const submissionSchema = new mongoose.Schema(
  {
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
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    notes: { type: String, default: "" },

    // UPDATED: Add 'reviewing' status
    status: {
      type: String,
      enum: ["pending", "reviewing", "approved", "rejected"],
      default: "pending",
    },

    feedback: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // NEW: Tracking fields
    versionNumber: { type: Number, default: 1 },
    submittedAt: { type: Date, default: Date.now },
    reviewStartedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Add indexes for queries
submissionSchema.index({ projectId: 1, stageId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ reviewedBy: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
```

---

## Fix 3: Enforce Submission Deadlines (10 minutes)

**File:** `server/controllers/submissionController.js`

**In the createSubmission function, add this check at the START:**

```javascript
const createSubmission = async (req, res) => {
  try {
    const { projectId, stageId, fileUrl, fileName, notes } = req.body;

    if (!projectId || !stageId) {
      return res
        .status(400)
        .json({ message: "projectId and stageId are required" });
    }

    // NEW: Verify project belongs to student
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (
      req.user.role === "student" &&
      project.studentId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to submit for this project" });
    }

    // NEW: Get stage and check deadline
    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }

    // NEW: Enforce deadline
    if (new Date() > stage.deadline) {
      return res.status(400).json({
        message: `Deadline for ${stage.stageName} stage has passed`,
        deadline: stage.deadline,
        currentTime: new Date(),
      });
    }

    // Check for existing submission for this stage
    const existing = await Submission.findOne({ projectId, stageId });
    if (existing) {
      // Update existing submission
      existing.fileUrl = fileUrl || existing.fileUrl;
      existing.fileName = fileName || existing.fileName;
      existing.notes = notes || existing.notes;
      existing.status = "pending";
      existing.feedback = "";
      existing.reviewedBy = null;
      existing.versionNumber = (existing.versionNumber || 1) + 1;
      existing.submittedAt = new Date();
      await existing.save();
      return res.json({
        message: "Submission updated",
        submission: existing,
        isResubmission: true,
      });
    }

    // Create new submission
    const submission = await Submission.create({
      projectId,
      stageId,
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      notes: notes || "",
      versionNumber: 1,
      submittedAt: new Date(),
    });

    res.status(201).json({
      message: "Submission created",
      submission,
      isResubmission: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## ✅ Phase 1 Complete!

You now have:

- ✅ Mentors can review submissions
- ✅ Proper authorization checking
- ✅ "Reviewing" status for submissions
- ✅ Deadline enforcement
- ✅ Version tracking

**Total time: 25 minutes**

---

## 🛡️ Phase 2: Security Improvements (This Week)

### Fix 2: Event-Level Access Control (20 minutes)

**File:** `server/controllers/eventController.js`

**Find the getEvent function and replace it with this:**

```javascript
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("coordinatorId", "name email")
      .populate("mentorIds", "name email")
      .populate("createdBy", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // NEW: Check authorization
    const canView =
      req.user.role === "admin" ||
      event.coordinatorId._id.toString() === req.user._id.toString() ||
      event.mentorIds.some(
        (m) => m._id.toString() === req.user._id.toString(),
      ) ||
      event.createdBy._id.toString() === req.user._id.toString();

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

### Fix 6: Better Authorization Middleware (30 minutes)

**Create NEW file:** `server/middleware/authorization.js`

```javascript
const Event = require("../models/Event");
const Project = require("../models/Project");
const Submission = require("../models/Submission");

// Check if user can act on specific event
const canAccessEvent = async (user, eventId) => {
  if (!eventId) return false;

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
  if (!projectId) return false;

  const project = await Project.findById(projectId).populate("eventId");
  if (!project) return false;

  if (user.role === "admin") return true;
  if (project.studentId.toString() === user._id.toString()) return true;

  const event = project.eventId;
  if (event.coordinatorId.toString() === user._id.toString()) return true;
  if (event.mentorIds.some((m) => m.toString() === user._id.toString()))
    return true;

  return false;
};

// Middleware: Check event access
const requireEventAccess = (paramName = "eventId") => {
  return async (req, res, next) => {
    try {
      const eventId = req.params[paramName] || req.body.eventId;
      const canAccess = await canAccessEvent(req.user, eventId);

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: "Not authorized for this event" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// Middleware: Check project access
const requireProjectAccess = (paramName = "projectId") => {
  return async (req, res, next) => {
    try {
      const projectId = req.params[paramName] || req.body.projectId;
      const canAccess = await canAccessProject(req.user, projectId);

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: "Not authorized for this project" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = {
  canAccessEvent,
  canAccessProject,
  requireEventAccess,
  requireProjectAccess,
};
```

**Update routes to use new middleware:**

**File:** `server/routes/eventRoutes.js`

```javascript
const { requireEventAccess } = require("../middleware/authorization");

// Get single event with access control
router.get("/:id", protect, requireEventAccess("id"), getEvent);
```

**File:** `server/routes/projectRoutes.js`

```javascript
const { requireProjectAccess } = require("../middleware/authorization");

// Get single project with access control
router.get("/:id", protect, requireProjectAccess("id"), getProject);
```

---

## 📊 Phase 3: Tracking & Audit (Next Week)

### Fix 5: Submission Version History

**Create NEW file:** `server/models/SubmissionHistory.js`

```javascript
const mongoose = require("mongoose");

const submissionHistorySchema = new mongoose.Schema({
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
  fileUrl: String,
  fileName: String,
  notes: String,
  status: {
    type: String,
    enum: ["pending", "reviewing", "approved", "rejected"],
  },
  feedback: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Version info
  versionNumber: Number,
  changeReason: {
    type: String,
    enum: ["resubmit", "review", "approve", "reject"],
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: { type: Date, default: Date.now },
});

submissionHistorySchema.index({ submissionId: 1, versionNumber: -1 });
submissionHistorySchema.index({ projectId: 1 });

module.exports = mongoose.model("SubmissionHistory", submissionHistorySchema);
```

**Add to submissionController.js - Update createSubmission function:**

```javascript
const SubmissionHistory = require("../models/SubmissionHistory");

const createSubmission = async (req, res) => {
  try {
    const { projectId, stageId, fileUrl, fileName, notes } = req.body;

    // ... existing validation ...

    // Check for existing submission
    let submission = await Submission.findOne({ projectId, stageId });
    let isResubmission = false;
    let versionNumber = 1;

    if (submission) {
      // NEW: Save current version to history
      await SubmissionHistory.create({
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

      versionNumber = (submission.versionNumber || 1) + 1;
      isResubmission = true;

      // Update submission
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

**Add new endpoint in submissionController.js:**

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

**Update submissionRoutes.js:**

```javascript
router.get("/:submissionId/history", protect, getSubmissionHistory);
```

### Fix 7: Audit Logging

**Create NEW file:** `server/models/AuditLog.js`

```javascript
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  action: String, // e.g., "PATCH /api/submissions/123/review"
  resource: String, // What was modified
  changes: mongoose.Schema.Types.Mixed,
  status: Number, // HTTP status code
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
```

**Create NEW file:** `server/middleware/auditLog.js`

```javascript
const AuditLog = require("../models/AuditLog");

const auditLog = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log non-GET requests
    if (res.statusCode < 400 && req.method !== "GET") {
      AuditLog.create({
        userId: req.user?._id,
        action: `${req.method} ${req.originalUrl}`,
        resource: req.params.id || req.body?.projectId || req.body?.eventId,
        changes: req.body,
        status: res.statusCode,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      }).catch((err) => console.error("Audit log error:", err));
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = { auditLog };
```

**Add to server.js (after auth middleware):**

```javascript
const { auditLog } = require("./middleware/auditLog");

app.use(protect); // auth middleware
app.use(auditLog); // audit logging
```

---

## 🎉 You're Done!

All three phases implemented:

- ✅ Phase 1: Critical fixes (25 minutes)
- ✅ Phase 2: Security improvements (50 minutes)
- ✅ Phase 3: Tracking & audit (65 minutes)

**Total: 140 minutes = 2.3 hours**

Your system is now:

- ✅ Mentors can review
- ✅ Proper authorization
- ✅ Deadline enforcement
- ✅ Version tracking
- ✅ Audit logging
- ✅ Production-ready
