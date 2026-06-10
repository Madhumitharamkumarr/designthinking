/**
 * ProjectFlow – Database Seed Script
 * Seeds realistic college data: users, events, stages, projects, submissions, mentor requests
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
const MentorRequest = require('./models/MentorRequest');

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
    MentorRequest.deleteMany({}),
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
      'healthcare, agriculture, education, or smart cities.',
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
      'prototype solving one of the government problem statements.',
    coordinatorId: coord2._id,
    mentorIds: [mentor2._id, mentor4._id],
    createdBy: admin._id,
    isActive: true,
  });

  console.log(`📅 Created ${await Event.countDocuments()} events`);

  // ────────────────────────────────────────────────────────────────────────
  // 3. STAGES
  // ────────────────────────────────────────────────────────────────────────
  const [e1s1, e1s2, e1s3] = await Stage.insertMany([
    { eventId: event1._id, stageName: 'Idea', order: 1, deadline: past(20), instructions: 'Submit a 1–2 page PDF describing your AI idea.' },
    { eventId: event1._id, stageName: 'Prototype', order: 2, deadline: past(5), instructions: 'Submit a working prototype with demo video and GitHub link.' },
    { eventId: event1._id, stageName: 'Final', order: 3, deadline: future(10), instructions: 'Final presentation (10 slides max).' },
  ]);

  const [e2s1, e2s2, e2s3] = await Stage.insertMany([
    { eventId: event2._id, stageName: 'Idea', order: 1, deadline: past(10), instructions: 'Submit Problem Statement document with SIH PS code.' },
    { eventId: event2._id, stageName: 'Prototype', order: 2, deadline: future(5), instructions: 'Build a functional prototype (60%+ features).' },
    { eventId: event2._id, stageName: 'Final', order: 3, deadline: future(20), instructions: 'Final hackathon day presentation. 15 min demo + 5 min Q&A.' },
  ]);

  console.log(`🗂  Created ${await Stage.countDocuments()} stages`);

  // ────────────────────────────────────────────────────────────────────────
  // 4. PROJECTS (with assignments)
  // ────────────────────────────────────────────────────────────────────────
  const proj1 = await Project.create({
    projectTitle: 'AI-Powered Health Assistant for Rural Clinics',
    description: 'A lightweight AI chatbot for ASHA workers using NLP and WhatsApp integration.',
    studentId: s1._id, eventId: event1._id,
    teamMembers: ['Aarav Mehta', 'Divya Subramaniam'],
    assignedMentor: mentor1._id, assignedCoordinator: coord1._id,
    mentorAssignedAt: past(18), coordinatorAssignedAt: past(20),
  });

  const proj2 = await Project.create({
    projectTitle: 'Smart Attendance System using Face Recognition',
    description: 'Automated classroom attendance using OpenCV and CNN with ERP integration.',
    studentId: s3._id, eventId: event1._id,
    teamMembers: ['Rohan Pillai', 'Sneha Patel'],
    assignedMentor: mentor3._id, assignedCoordinator: coord1._id,
    mentorAssignedAt: past(19), coordinatorAssignedAt: past(20),
  });

  const proj3 = await Project.create({
    projectTitle: 'Waste Classification and Management Tracker',
    description: 'Mobile + web app using MobileNetV2 for waste classification with gamified incentives.',
    studentId: s5._id, eventId: event1._id,
    teamMembers: ['Kiran Reddy'],
    assignedMentor: mentor1._id, assignedCoordinator: coord1._id,
    mentorAssignedAt: past(17), coordinatorAssignedAt: past(20),
  });

  const proj4 = await Project.create({
    projectTitle: 'Campus Navigation App for Visually Impaired Students',
    description: 'Indoor navigation using BLE beacons and audio cues with Flutter app.',
    studentId: s6._id, eventId: event2._id,
    teamMembers: ['Lakshmi Venkatesh', 'Arjun Nambiar'],
    assignedMentor: mentor2._id, assignedCoordinator: coord2._id,
    mentorAssignedAt: past(8), coordinatorAssignedAt: past(10),
  });

  const proj5 = await Project.create({
    projectTitle: 'Farmer Direct Market – Agricultural Supply Chain App',
    description: 'Mobile marketplace connecting farmers to buyers with live APMC prices and AI demand forecasting.',
    studentId: s2._id, eventId: event2._id,
    teamMembers: ['Divya Subramaniam', 'Aarav Mehta'],
    assignedMentor: mentor4._id, assignedCoordinator: coord2._id,
    mentorAssignedAt: past(9), coordinatorAssignedAt: past(10),
  });

  console.log(`📁 Created ${await Project.countDocuments()} projects`);

  // ────────────────────────────────────────────────────────────────────────
  // 5. MENTOR REQUESTS
  // ────────────────────────────────────────────────────────────────────────
  await MentorRequest.insertMany([
    // Approved requests (matched to assignments above)
    { projectId: proj1._id, studentId: s1._id, requestedMentorId: mentor1._id, eventId: event1._id, reason: 'Dr. Priya has expertise in NLP and healthcare AI.', status: 'approved', adminNote: 'Good match — approved.', reviewedBy: admin._id, reviewedAt: past(18) },
    { projectId: proj2._id, studentId: s3._id, requestedMentorId: mentor3._id, eventId: event1._id, reason: 'Dr. Meena specializes in computer vision.', status: 'approved', adminNote: 'Approved — CV expertise needed.', reviewedBy: admin._id, reviewedAt: past(19) },
    { projectId: proj4._id, studentId: s6._id, requestedMentorId: mentor2._id, eventId: event2._id, reason: 'Mr. Arun has mobile dev experience with Flutter.', status: 'approved', adminNote: 'Perfect fit for mobile project.', reviewedBy: admin._id, reviewedAt: past(8) },
    // Rejected request (student wanted different mentor)
    { projectId: proj5._id, studentId: s2._id, requestedMentorId: mentor2._id, eventId: event2._id, reason: 'Mr. Arun seems great for web projects.', status: 'rejected', adminNote: 'Mr. Suresh Babu is a better fit for agri-tech. Assigned Mr. Suresh instead.', reviewedBy: admin._id, reviewedAt: past(9) },
    // Pending request (Kiran hasn't been reviewed yet — but admin already assigned directly)
    { projectId: proj3._id, studentId: s5._id, requestedMentorId: mentor3._id, eventId: event1._id, reason: 'Dr. Meena has data analytics background useful for waste tracking.', status: 'rejected', adminNote: 'Dr. Priya assigned instead — she has IoT + classification experience.', reviewedBy: admin._id, reviewedAt: past(17) },
  ]);

  console.log(`📩 Created ${await MentorRequest.countDocuments()} mentor requests`);

  // ────────────────────────────────────────────────────────────────────────
  // 6. SUBMISSIONS
  // ────────────────────────────────────────────────────────────────────────
  const submissions = [];

  // PROJECT 1: AI Health Assistant — Idea ✅, Prototype ✅, Final ⏳
  submissions.push(
    { projectId: proj1._id, stageId: e1s1._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_idea.pdf', fileName: 'AI_Health_Assistant_Idea.pdf', notes: 'Preliminary surveys across 3 PHC centres.', status: 'approved', feedback: 'Excellent problem framing. WhatsApp integration is practical. Approved.', reviewedBy: mentor1._id, createdAt: past(18) },
    { projectId: proj1._id, stageId: e1s2._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_prototype.zip', fileName: 'AI_Health_Prototype_v1.zip', notes: 'GitHub + Demo video + Deployed at health-assist.vercel.app', status: 'approved', feedback: 'Strong MVP. Tamil language support impressive. Approved for final.', reviewedBy: mentor1._id, createdAt: past(3) },
    { projectId: proj1._id, stageId: e1s3._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_ai_health_final.pdf', fileName: 'AI_Health_Final_Presentation.pdf', notes: 'Final deck with user testimonials from 2 ASHA workers.', status: 'pending', feedback: '', reviewedBy: null, createdAt: past(1) },
  );

  // PROJECT 2: Smart Attendance — Idea ✅, Prototype ❌→⏳
  submissions.push(
    { projectId: proj2._id, stageId: e1s1._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_attendance_idea.pdf', fileName: 'Smart_Attendance_Idea.pdf', notes: 'Validated with 3 faculty members.', status: 'approved', feedback: 'Clear problem statement. ERP integration is the USP. Proceed.', reviewedBy: mentor3._id, createdAt: past(19) },
    { projectId: proj2._id, stageId: e1s2._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_attendance_proto_v2.zip', fileName: 'Attendance_Prototype_v2_Fixed.zip', notes: 'Fixed lighting issue. Accuracy now 91%. CSV export added.', status: 'pending', feedback: '', reviewedBy: null, createdAt: past(2) },
  );

  // PROJECT 3: Waste Tracker — Idea ✅, Prototype ⏳
  submissions.push(
    { projectId: proj3._id, stageId: e1s1._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_waste_idea.pdf', fileName: 'Waste_Management_Idea.pdf', notes: 'Inspired by Swachh Bharat mission gaps.', status: 'approved', feedback: 'Good civic impact. Gamification is innovative. Proceed.', reviewedBy: mentor1._id, createdAt: past(17) },
    { projectId: proj3._id, stageId: e1s2._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_waste_proto.zip', fileName: 'WasteTracker_MVP.zip', notes: 'Model trained on 4000 images. Android app functional.', status: 'pending', feedback: '', reviewedBy: null, createdAt: past(4) },
  );

  // PROJECT 4: Campus Navigation — Idea ✅, Prototype ⏳
  submissions.push(
    { projectId: proj4._id, stageId: e2s1._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_nav_idea.pdf', fileName: 'Campus_Nav_Idea_Doc.pdf', notes: 'Surveyed 12 visually impaired students.', status: 'approved', feedback: 'Outstanding social impact. Approved.', reviewedBy: mentor2._id, createdAt: past(8) },
    { projectId: proj4._id, stageId: e2s2._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_nav_proto.apk', fileName: 'CampusNav_v0.9_Beta.apk', notes: '5 BLE beacons deployed. Indoor accuracy ~2m.', status: 'pending', feedback: '', reviewedBy: null, createdAt: past(1) },
  );

  // PROJECT 5: Farmer Market — Idea ✅, Prototype ❌
  submissions.push(
    { projectId: proj5._id, stageId: e2s1._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_farmer_idea.pdf', fileName: 'FarmerDirect_IdeaDoc.pdf', notes: 'Interviewed 8 farmers from Coimbatore and Erode.', status: 'approved', feedback: 'Very relevant to SIH AG2026-04. Vernacular UI is key. Approved.', reviewedBy: mentor4._id, createdAt: past(9) },
    { projectId: proj5._id, stageId: e2s2._id, fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample_farmer_proto_v1.zip', fileName: 'FarmerMarket_ProtoV1.zip', notes: 'Basic screens done. Payment in progress.', status: 'rejected', feedback: 'Incomplete — payment crashes, Tamil UI broken. Focus on 3 core features. Resubmit.', reviewedBy: mentor4._id, createdAt: past(4) },
  );

  await Submission.insertMany(submissions);
  console.log(`📤 Created ${submissions.length} submissions`);

  // ────────────────────────────────────────────────────────────────────────
  // 7. SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SEED COMPLETE – ProjectFlow is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 LOGIN CREDENTIALS (all passwords: Password@123)');
  console.log('──────────────────────────────────────────────────');
  console.log('👑 ADMIN:  admin@college.edu');
  console.log('🧑‍🏫 COORD:  anitha.sharma@college.edu | karthik.raman@college.edu');
  console.log('👨‍💼 MENTOR: priya.nair@college.edu | arun.krishnan@college.edu | meena.iyer@college.edu | suresh.babu@college.edu');
  console.log('🎓 STUDENT: aarav.mehta@student.college.edu | divya.sub@student.college.edu | rohan.pillai@student.college.edu');
  console.log('\n📌 PROJECT ASSIGNMENTS');
  console.log('──────────────────────────────────────────────────');
  console.log('AI Health Assistant   → Mentor: Dr. Priya Nair    | Coord: Prof. Anitha Sharma');
  console.log('Smart Attendance      → Mentor: Dr. Meena Iyer    | Coord: Prof. Anitha Sharma');
  console.log('Waste Tracker         → Mentor: Dr. Priya Nair    | Coord: Prof. Anitha Sharma');
  console.log('Campus Nav App        → Mentor: Mr. Arun Krishnan | Coord: Prof. Karthik Raman');
  console.log('Farmer Direct Market  → Mentor: Mr. Suresh Babu   | Coord: Prof. Karthik Raman');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  mongoose.connection.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.connection.close();
  process.exit(1);
});
