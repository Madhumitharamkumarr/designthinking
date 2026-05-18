/**
 * ProjectFlow – Database Seed Script
 * Seeds realistic college data: users, events, stages, projects, submissions
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('./models/User');
const Event = require('./models/Event');
const Stage = require('./models/Stage');
const Project = require('./models/Project');
const Submission = require('./models/Submission');

// ── Helpers ──────────────────────────────────────────────────────────────────
const future = (days) => new Date(Date.now() + days * 86400000);
const past = (days) => new Date(Date.now() - days * 86400000);

// ── Seed Function ────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Stage.deleteMany({}),
    Project.deleteMany({}),
    Submission.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data');

  // ────────────────────────────────────────────────────────────────────────
  // 1. USERS
  // ────────────────────────────────────────────────────────────────────────
  const defaultPw = 'Password@123';

  console.log('🔑 Creating users (hashing passwords)...');

  // Admin
  const admin = await User.create({
    name: 'Dr. Rajesh Kumar',
    email: 'admin@college.edu',
    password: defaultPw,
    role: 'admin',
  });

  // Coordinators
  const coord1 = await User.create({ name: 'Prof. Anitha Sharma', email: 'anitha.sharma@college.edu', password: defaultPw, role: 'coordinator' });
  const coord2 = await User.create({ name: 'Prof. Karthik Raman',  email: 'karthik.raman@college.edu',  password: defaultPw, role: 'coordinator' });

  // Mentors
  const mentor1 = await User.create({ name: 'Dr. Priya Nair',       email: 'priya.nair@college.edu',       password: defaultPw, role: 'mentor' });
  const mentor2 = await User.create({ name: 'Mr. Arun Krishnan',    email: 'arun.krishnan@college.edu',    password: defaultPw, role: 'mentor' });
  const mentor3 = await User.create({ name: 'Dr. Meena Iyer',       email: 'meena.iyer@college.edu',       password: defaultPw, role: 'mentor' });
  const mentor4 = await User.create({ name: 'Mr. Suresh Babu',      email: 'suresh.babu@college.edu',      password: defaultPw, role: 'mentor' });

  // Students
  const s1 = await User.create({ name: 'Aarav Mehta',          email: 'aarav.mehta@student.college.edu',       password: defaultPw, role: 'student' });
  const s2 = await User.create({ name: 'Divya Subramaniam',    email: 'divya.sub@student.college.edu',         password: defaultPw, role: 'student' });
  const s3 = await User.create({ name: 'Rohan Pillai',         email: 'rohan.pillai@student.college.edu',      password: defaultPw, role: 'student' });
  const s4 = await User.create({ name: 'Sneha Patel',          email: 'sneha.patel@student.college.edu',       password: defaultPw, role: 'student' });
  const s5 = await User.create({ name: 'Kiran Reddy',          email: 'kiran.reddy@student.college.edu',       password: defaultPw, role: 'student' });
  const s6 = await User.create({ name: 'Lakshmi Venkatesh',    email: 'lakshmi.v@student.college.edu',         password: defaultPw, role: 'student' });
  const s7 = await User.create({ name: 'Arjun Nambiar',        email: 'arjun.nambiar@student.college.edu',     password: defaultPw, role: 'student' });


  console.log(`👤 Created ${await User.countDocuments()} users`);

  // ────────────────────────────────────────────────────────────────────────
  // 2. EVENTS
  // ────────────────────────────────────────────────────────────────────────
  const event1 = await Event.create({
    title: 'AI Ideathon 2026',
    type: 'ideathon',
    description:
      'An intercollegiate ideathon focused on Applied Artificial Intelligence and Machine Learning. ' +
      'Students are expected to present novel ideas that leverage AI to solve real-world problems in ' +
      'healthcare, agriculture, education, or smart cities. Industry experts and faculty will evaluate ' +
      'submissions across three structured stages.',
    coordinatorId: coord1._id,
    mentorIds: [mentor1._id, mentor3._id],
    createdBy: admin._id,
    isActive: true,
  });

  const event2 = await Event.create({
    title: 'Smart India Hackathon – Internal Round',
    type: 'hackathon',
    description:
      'Internal qualifying round for Smart India Hackathon (SIH) 2026. Teams must build a working ' +
      'prototype solving one of the government problem statements across domains like education, ' +
      'agriculture, health, and infrastructure. Top 2 teams will be nominated for the national round.',
    coordinatorId: coord2._id,
    mentorIds: [mentor2._id, mentor4._id],
    createdBy: admin._id,
    isActive: true,
  });

  console.log(`📅 Created ${await Event.countDocuments()} events`);

  // ────────────────────────────────────────────────────────────────────────
  // 3. STAGES
  // ────────────────────────────────────────────────────────────────────────

  // Event 1 stages (AI Ideathon) — partially past
  const [e1s1, e1s2, e1s3] = await Stage.insertMany([
    {
      eventId: event1._id,
      stageName: 'Idea',
      order: 1,
      deadline: past(20),
      instructions:
        'Submit a 1–2 page PDF describing your AI idea. Include: Problem Statement, Proposed Solution, ' +
        'Target Users, Expected Impact, and any preliminary research references. ' +
        'Avoid technical jargon — clarity and feasibility will be evaluated.',
    },
    {
      eventId: event1._id,
      stageName: 'Prototype',
      order: 2,
      deadline: past(5),
      instructions:
        'Submit a working prototype (even a basic MVP). Include a demo video (max 5 min), ' +
        'GitHub link or deployment URL, and a brief technical write-up (architecture, tech stack, ' +
        'data flow). Bonus points for live demos. Incomplete submissions will not be reviewed.',
    },
    {
      eventId: event1._id,
      stageName: 'Final',
      order: 3,
      deadline: future(10),
      instructions:
        'Deliver a final presentation (10 slides max) covering: Problem Overview, Solution Demo, ' +
        'Business/Social Impact, Scalability Plan, and Future Roadmap. ' +
        'Presentations will be held in Committee Room B on the final day. Dress code: Formal.',
    },
  ]);

  // Event 2 stages (SIH Internal) — current/active
  const [e2s1, e2s2, e2s3] = await Stage.insertMany([
    {
      eventId: event2._id,
      stageName: 'Idea',
      order: 1,
      deadline: past(10),
      instructions:
        'Submit a Problem Statement document. Clearly state the government PS code you are addressing, ' +
        'your proposed approach, team details, and a rough timeline. ' +
        'Maximum 3 pages. Use the official SIH template provided on the notice board.',
    },
    {
      eventId: event2._id,
      stageName: 'Prototype',
      order: 2,
      deadline: future(5),
      instructions:
        'Build a functional prototype demonstrating at least 60% of the final solution features. ' +
        'Submit source code (GitHub), a recorded walkthrough (max 8 min), and a one-page technical summary. ' +
        'Code quality, documentation, and user experience will all be evaluated.',
    },
    {
      eventId: event2._id,
      stageName: 'Final',
      order: 3,
      deadline: future(20),
      instructions:
        'Final hackathon day presentation. You will get 15 minutes to demo + 5 minutes Q&A. ' +
        'Panel includes industry judges and college faculty. Evaluation criteria: Innovation (30%), ' +
        'Feasibility (25%), Technical Execution (25%), Presentation (20%). ' +
        'Top 2 teams qualify for the national SIH round.',
    },
  ]);

  console.log(`🗂  Created ${await Stage.countDocuments()} stages`);

  // ────────────────────────────────────────────────────────────────────────
  // 4. PROJECTS
  // ────────────────────────────────────────────────────────────────────────

  // AI Ideathon projects
  const proj1 = await Project.create({
    projectTitle: 'AI-Powered Health Assistant for Rural Clinics',
    description:
      'A lightweight AI chatbot trained on common rural health conditions that assists ASHA workers ' +
      'in triaging patients. Uses NLP to process vernacular language inputs and provide treatment ' +
      'guidance. Integrated with WhatsApp for accessibility in low-bandwidth areas.',
    studentId: s1._id,
    eventId: event1._id,
    teamMembers: ['Aarav Mehta', 'Divya Subramaniam'],
  });

  const proj2 = await Project.create({
    projectTitle: 'Smart Attendance System using Face Recognition',
    description:
      'Automated classroom attendance using real-time face detection via OpenCV and a CNN model trained ' +
      'on student ID photographs. Dashboard for faculty with attendance analytics, auto-alerts for ' +
      'students below 75%, and export to college ERP format.',
    studentId: s3._id,
    eventId: event1._id,
    teamMembers: ['Rohan Pillai', 'Sneha Patel'],
  });

  const proj3 = await Project.create({
    projectTitle: 'Waste Classification and Management Tracker',
    description:
      'Mobile + web app that uses an image classifier (MobileNetV2) to identify waste type (organic, ' +
      'plastic, e-waste) from camera input. Maps nearby disposal/recycling centers and provides ' +
      'gamified incentives for responsible disposal. Targeting urban apartment complexes.',
    studentId: s5._id,
    eventId: event1._id,
    teamMembers: ['Kiran Reddy'],
  });

  // SIH Internal projects
  const proj4 = await Project.create({
    projectTitle: 'Campus Navigation App for Visually Impaired Students',
    description:
      'An indoor navigation system using BLE beacons and audio cues to guide visually impaired students ' +
      'across college campus. The Flutter app integrates with Google Maps SDK for outdoor routing and ' +
      'a custom beacon mesh for indoor halls, labs, and libraries.',
    studentId: s6._id,
    eventId: event2._id,
    teamMembers: ['Lakshmi Venkatesh', 'Arjun Nambiar'],
  });

  const proj5 = await Project.create({
    projectTitle: 'Farmer Direct Market – Agricultural Supply Chain App',
    description:
      'A mobile-first marketplace connecting farmers directly to buyers, cutting out middlemen. ' +
      'Features: live price feed from APMC mandis, logistics tie-up with third-party delivery, ' +
      'vernacular UI (Tamil/Hindi/Malayalam), and AI-based crop demand forecasting. ' +
      'Addresses SIH PS ID: AG2026-04.',
    studentId: s2._id,
    eventId: event2._id,
    teamMembers: ['Divya Subramaniam', 'Aarav Mehta'],
  });

  console.log(`📁 Created ${await Project.countDocuments()} projects`);

  // ────────────────────────────────────────────────────────────────────────
  // 5. SUBMISSIONS
  // ────────────────────────────────────────────────────────────────────────
  const submissions = [];

  // ── PROJECT 1: AI Health Assistant ── (Leader: Aarav, Event 1)
  // Stage 1 – Idea – APPROVED
  submissions.push({
    projectId: proj1._id,
    stageId: e1s1._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_idea.pdf',
    fileName: 'AI_Health_Assistant_Idea.pdf',
    notes: 'We have conducted preliminary surveys across 3 PHC centres in Coimbatore district.',
    status: 'approved',
    feedback:
      'Excellent problem framing. The WhatsApp integration angle is highly practical for rural areas. ' +
      'Please ensure the clinical accuracy framework is documented in the next stage. Approved.',
    reviewedBy: coord1._id,
    createdAt: past(18),
  });

  // Stage 2 – Prototype – APPROVED
  submissions.push({
    projectId: proj1._id,
    stageId: e1s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_prototype.zip',
    fileName: 'AI_Health_Prototype_v1.zip',
    notes:
      'GitHub: github.com/aarav-mehta/health-assist | Demo video: youtu.be/demo-link | ' +
      'Deployed at: health-assist.vercel.app',
    status: 'approved',
    feedback:
      'Strong MVP. The Tamil language support is impressive. Minor issue: the symptom classifier ' +
      'occasionally misclassifies fever with malaria — add more training samples. Approved for final.',
    reviewedBy: coord1._id,
    createdAt: past(3),
  });

  // Stage 3 – Final – PENDING (not yet reviewed)
  submissions.push({
    projectId: proj1._id,
    stageId: e1s3._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_final.pdf',
    fileName: 'AI_Health_Final_Presentation.pdf',
    notes: 'Final deck includes user testimonials from 2 ASHA workers who piloted the app.',
    status: 'pending',
    feedback: '',
    reviewedBy: null,
    createdAt: past(1),
  });

  // ── PROJECT 2: Smart Attendance ── (Leader: Rohan, Event 1)
  // Stage 1 – Idea – APPROVED
  submissions.push({
    projectId: proj2._id,
    stageId: e1s1._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_attendance_idea.pdf',
    fileName: 'Smart_Attendance_Idea.pdf',
    notes: 'Idea validated with 3 faculty members from CSE and ECE departments.',
    status: 'approved',
    feedback:
      'Clear problem statement. Face recognition for attendance is a proven concept — your differentiation ' +
      'via ERP integration and alert system is the USP. Proceed to prototype. Good work.',
    reviewedBy: coord1._id,
    createdAt: past(19),
  });

  // Stage 2 – Prototype – REJECTED (needs more work)
  submissions.push({
    projectId: proj2._id,
    stageId: e1s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_attendance_proto_v1.zip',
    fileName: 'Attendance_Prototype_v1.zip',
    notes: 'First version — face detection works under good lighting. Still optimising for low light.',
    status: 'rejected',
    feedback:
      'The prototype only works under controlled lighting. The face recognition accuracy drops to ~52% ' +
      'under fluorescent classroom lights — this is a critical flaw. Also, the ERP export feature is ' +
      'missing entirely. Please fix these and resubmit within 3 days. Need more real-world validation.',
    reviewedBy: coord1._id,
    createdAt: past(6),
  });

  // Stage 2 – Prototype – Re-submitted – PENDING
  submissions.push({
    projectId: proj2._id,
    stageId: e1s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_attendance_proto_v2.zip',
    fileName: 'Attendance_Prototype_v2_Fixed.zip',
    notes:
      'Fixed lighting issue using histogram equalisation (accuracy now 91%). Added CSV export ' +
      'compatible with Fedena ERP. Tested on 40 students in CS-101 batch.',
    status: 'pending',
    feedback: '',
    reviewedBy: null,
    createdAt: past(2),
  });

  // ── PROJECT 3: Waste Tracker ── (Leader: Kiran, Event 1)
  // Stage 1 – Idea – APPROVED
  submissions.push({
    projectId: proj3._id,
    stageId: e1s1._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_waste_idea.pdf',
    fileName: 'Waste_Management_Idea.pdf',
    notes: 'Idea inspired by Swachh Bharat mission gaps in apartment-level waste tracking.',
    status: 'approved',
    feedback:
      'Good idea with strong civic impact. The gamification layer is innovative. ' +
      'Ensure the image model handles mixed/unclear waste categories gracefully. Proceed.',
    reviewedBy: coord1._id,
    createdAt: past(17),
  });

  // Stage 2 – Prototype – PENDING
  submissions.push({
    projectId: proj3._id,
    stageId: e1s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_waste_proto.zip',
    fileName: 'WasteTracker_MVP.zip',
    notes: 'Model trained on 4000 images across 5 categories. Android app is functional. Web dashboard TBD.',
    status: 'pending',
    feedback: '',
    reviewedBy: null,
    createdAt: past(4),
  });

  // ── PROJECT 4: Campus Navigation ── (Leader: Lakshmi, Event 2)
  // Stage 1 – Idea – APPROVED
  submissions.push({
    projectId: proj4._id,
    stageId: e2s1._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_nav_idea.pdf',
    fileName: 'Campus_Nav_Idea_Doc.pdf',
    notes: 'Surveyed 12 visually impaired students and 5 staff. Received support from Disability Cell.',
    status: 'approved',
    feedback:
      'Outstanding social impact. Collaboration with the Disability Cell shows real commitment. ' +
      'Good idea, improve UI for accessibility (contrast, font size, haptic patterns). ' +
      'Connect with the college infrastructure team for beacon placement approvals. Approved.',
    reviewedBy: coord2._id,
    createdAt: past(8),
  });

  // Stage 2 – Prototype – PENDING (just submitted)
  submissions.push({
    projectId: proj4._id,
    stageId: e2s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_nav_proto.apk',
    fileName: 'CampusNav_v0.9_Beta.apk',
    notes:
      '5 BLE beacons deployed in Block A (labs floor). Indoor accuracy ~2m. ' +
      'Audio landmarks working. Outdoor Google Maps integration complete.',
    status: 'pending',
    feedback: '',
    reviewedBy: null,
    createdAt: past(1),
  });

  // ── PROJECT 5: Farmer Market ── (Leader: Divya, Event 2)
  // Stage 1 – Idea – APPROVED
  submissions.push({
    projectId: proj5._id,
    stageId: e2s1._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_farmer_idea.pdf',
    fileName: 'FarmerDirect_IdeaDoc.pdf',
    notes: 'Interviewed 8 farmers from Coimbatore and Erode districts. Price data sourced from agmarknet.gov.in.',
    status: 'approved',
    feedback:
      'Very relevant to SIH Agriculture problem statement AG2026-04. The vernacular UI is a key differentiator. ' +
      'Verify the logistics API integration feasibility — partner availability is often the bottleneck for such apps. Approved.',
    reviewedBy: coord2._id,
    createdAt: past(9),
  });

  // Stage 2 – Prototype – REJECTED
  submissions.push({
    projectId: proj5._id,
    stageId: e2s2._id,
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_farmer_proto_v1.zip',
    fileName: 'FarmerMarket_ProtoV1.zip',
    notes: 'Basic screens done. Payment integration is in progress. Tamil UI 60% complete.',
    status: 'rejected',
    feedback:
      'This submission appears incomplete — payment flow crashes on Android 12, Tamil UI is broken on smaller screens, ' +
      'and the demand forecasting feature mentioned in your idea doc is entirely absent. ' +
      'For an SIH-level hackathon, the bar is higher. Resubmit with at least a stable core flow. ' +
      'Suggestion: Focus on 3 core features done well rather than 7 half-done ones.',
    reviewedBy: coord2._id,
    createdAt: past(4),
  });

  await Submission.insertMany(submissions);
  console.log(`📤 Created ${submissions.length} submissions`);

  // ────────────────────────────────────────────────────────────────────────
  // 6. SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SEED COMPLETE – ProjectFlow is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 LOGIN CREDENTIALS (all passwords: Password@123)');
  console.log('──────────────────────────────────────────────────');
  console.log('👑 ADMIN');
  console.log('   admin@college.edu         → Dr. Rajesh Kumar\n');
  console.log('🧑‍🏫 COORDINATORS');
  console.log('   anitha.sharma@college.edu → Prof. Anitha Sharma (AI Ideathon)');
  console.log('   karthik.raman@college.edu → Prof. Karthik Raman (SIH Internal)\n');
  console.log('👨‍💼 MENTORS');
  console.log('   priya.nair@college.edu    → Dr. Priya Nair       (AI/ML)');
  console.log('   arun.krishnan@college.edu → Mr. Arun Krishnan    (Web Dev)');
  console.log('   meena.iyer@college.edu    → Dr. Meena Iyer       (Data Analytics)');
  console.log('   suresh.babu@college.edu   → Mr. Suresh Babu      (Mobile Apps)\n');
  console.log('🎓 STUDENTS');
  console.log('   aarav.mehta@student.college.edu    → Aarav Mehta       (AI Health Assistant)');
  console.log('   divya.sub@student.college.edu      → Divya Subramaniam (Farmer Market)');
  console.log('   rohan.pillai@student.college.edu   → Rohan Pillai      (Smart Attendance)');
  console.log('   sneha.patel@student.college.edu    → Sneha Patel       (Team: Smart Attendance)');
  console.log('   kiran.reddy@student.college.edu    → Kiran Reddy       (Waste Tracker)');
  console.log('   lakshmi.v@student.college.edu      → Lakshmi Venkatesh (Campus Nav)');
  console.log('   arjun.nambiar@student.college.edu  → Arjun Nambiar     (Team: Campus Nav)');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUBMISSION STATUSES');
  console.log('──────────────────────────────────────────────────');
  console.log('AI Health Assistant   → Idea ✅  Prototype ✅  Final ⏳');
  console.log('Smart Attendance      → Idea ✅  Prototype ❌→⏳');
  console.log('Waste Tracker         → Idea ✅  Prototype ⏳');
  console.log('Campus Nav App        → Idea ✅  Prototype ⏳');
  console.log('Farmer Direct Market  → Idea ✅  Prototype ❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  mongoose.connection.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.connection.close();
  process.exit(1);
});
