import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { ROLES, PROGRAM_STATUS, ENROLLMENT_STATUS, ATTENDANCE_STATUS, ASSESSMENT_TYPE } from '../config/constants.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { Batch } from '../models/Batch.js';
import { ClassSection } from '../models/ClassSection.js';
import { Student } from '../models/Student.js';
import { StudentAcademicHistory } from '../models/StudentAcademicHistory.js';
import { TrainingCategory } from '../models/TrainingCategory.js';
import { TrainingProgram } from '../models/TrainingProgram.js';
import { TrainingSession } from '../models/TrainingSession.js';
import { TrainingEnrollment } from '../models/TrainingEnrollment.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentResult } from '../models/AssessmentResult.js';
import { PlacementProfile } from '../models/PlacementProfile.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

const STUDENT_NAMES_50 = [
  'Aarav Sharma', 'Ananya Iyer', 'Rohan Verma', 'Priya Patel', 'Karthik Raman',
  'Sneha Rao', 'Aditya Nair', 'Divya Reddy', 'Vikram Malhotra', 'Pooja Hegde',
  'Arjun Sen', 'Meera Nambiar', 'Siddharth Joshi', 'Neha Deshmukh', 'Varun Menon',
  'Ritu Saxena', 'Gaurav Kulkarni', 'Kavya Pillai', 'Manoj Kumar', 'Swati Bhatt',
  'Deepak Gupta', 'Ishita Sengupta', 'Suresh Balaji', 'Tanvi Chawla', 'Rahul Dravid K',
  'Nandini Pai', 'Abhishek Mishra', 'Sanjana Roy', 'Pranav Hegde', 'Shruti Venkatesh',
  'Nikhil Namboodiri', 'Shalini Das', 'Harish Chandra', 'Tarun Varma', 'Lavanya Sundaram',
  'Akash Dubey', 'Bhavna Chauhan', 'Kiran Prabhu', 'Vinay Prasad', 'Archana Nair',
  'Suraj Tiwari', 'Gayatri Shenoy', 'Dinesh Karthik', 'Monika Soni', 'Gautam Gambhir R',
  'Preeti Somani', 'Ashok Leyland N', 'Anuradha Paul', 'Rajesh Kanna', 'Vidya Balan S'
];

export async function runSeed() {
  await connectDB();
  console.log('[Seed] Clearing existing collections...');

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    AcademicYear.deleteMany({}),
    Batch.deleteMany({}),
    ClassSection.deleteMany({}),
    Student.deleteMany({}),
    StudentAcademicHistory.deleteMany({}),
    TrainingCategory.deleteMany({}),
    TrainingProgram.deleteMany({}),
    TrainingSession.deleteMany({}),
    TrainingEnrollment.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Assessment.deleteMany({}),
    AssessmentResult.deleteMany({}),
    PlacementProfile.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('[Seed] Creating Departments...');
  const depts = await Department.create([
    { code: 'CSE', name: 'Computer Science and Engineering', isActive: true },
    { code: 'AIDS', name: 'Artificial Intelligence and Data Science', isActive: true },
    { code: 'ECE', name: 'Electronics and Communication Engineering', isActive: true },
    { code: 'EEE', name: 'Electrical and Electronics Engineering', isActive: true },
    { code: 'MECH', name: 'Mechanical Engineering', isActive: true },
    { code: 'CIVIL', name: 'Civil Engineering', isActive: true },
  ]);
  const cseDept = depts[0];
  const aidsDept = depts[1];

  console.log('[Seed] Creating Academic Years (4-Year Progression)...');
  const years = await AcademicYear.create([
    { name: '2023-24', startDate: new Date('2023-07-01'), endDate: new Date('2024-05-31'), isCurrent: false, order: 1 },
    { name: '2024-25', startDate: new Date('2024-07-01'), endDate: new Date('2025-05-31'), isCurrent: false, order: 2 },
    { name: '2025-26', startDate: new Date('2025-07-01'), endDate: new Date('2026-05-31'), isCurrent: false, order: 3 },
    { name: '2026-27', startDate: new Date('2026-07-01'), endDate: new Date('2027-05-31'), isCurrent: true, order: 4 },
  ]);
  const [ay1, ay2, ay3, ay4] = years;

  console.log('[Seed] Creating Batches...');
  await Batch.create({
    name: '2022-2026',
    startYear: 2022,
    endYear: 2026,
    isActive: true,
  });
  const batch = await Batch.create({
    name: '2023-2027',
    startYear: 2023,
    endYear: 2027,
    isActive: true,
  });
  await Batch.create({
    name: '2024-2028',
    startYear: 2024,
    endYear: 2028,
    isActive: true,
  });

  console.log('[Seed] Creating Class Sections across all 4 years...');
  const sections = await ClassSection.create([
    { academicYearId: ay1._id, departmentId: cseDept._id, batchId: batch._id, yearOfStudy: 1, section: 'A', displayName: 'I CSE A' },
    { academicYearId: ay2._id, departmentId: cseDept._id, batchId: batch._id, yearOfStudy: 2, section: 'A', displayName: 'II CSE A' },
    { academicYearId: ay3._id, departmentId: cseDept._id, batchId: batch._id, yearOfStudy: 3, section: 'A', displayName: 'III CSE A' },
    { academicYearId: ay4._id, departmentId: cseDept._id, batchId: batch._id, yearOfStudy: 4, section: 'A', displayName: 'IV CSE A' },
    { academicYearId: ay4._id, departmentId: cseDept._id, batchId: batch._id, yearOfStudy: 4, section: 'B', displayName: 'IV CSE B' },
    { academicYearId: ay4._id, departmentId: aidsDept._id, batchId: batch._id, yearOfStudy: 4, section: 'A', displayName: 'IV AIDS A' },
    { academicYearId: ay4._id, departmentId: depts[2]._id, batchId: batch._id, yearOfStudy: 4, section: 'A', displayName: 'IV ECE A' },
  ]);
  const [secY1, secY2, secY3, secY4] = sections;

  console.log('[Seed] Creating Training Categories...');
  const categories = await TrainingCategory.create([
    { name: 'Aptitude & Reasoning', code: 'APT', color: '#3b82f6', description: 'Quantitative, Logical & Verbal Aptitude', order: 1 },
    { name: 'Programming & Coding', code: 'CODE', color: '#10b981', description: 'C, Java, Python, Data Structures & Algorithms', order: 2 },
    { name: 'Full Stack & Database', code: 'TECH', color: '#8b5cf6', description: 'Java Full Stack, SQL, Web Technologies', order: 3 },
    { name: 'Soft Skills & Communication', code: 'SOFT', color: '#f59e0b', description: 'Corporate Communication, Resume, GD', order: 4 },
    { name: 'Mock & HR Interviews', code: 'MOCK', color: '#ec4899', description: 'Technical and HR Mock Interview Rounds', order: 5 },
  ]);

  const [catApt, catCode, catTech, catSoft, catMock] = categories;

  console.log('[Seed] Creating 50 Students for IV CSE A...');
  const studentDocs = [];
  for (let i = 1; i <= 50; i++) {
    const numStr = i.toString().padStart(3, '0');
    const rollStr = i.toString().padStart(2, '0');
    const name = STUDENT_NAMES_50[i - 1];
    const email = `23cs${numStr}@placerise.edu`;

    studentDocs.push({
      registerNumber: `23CS${numStr}`,
      rollNumber: rollStr,
      name,
      email,
      phone: `+91 98765 ${40000 + i}`,
      gender: i % 3 === 0 ? 'Female' : 'Male',
      departmentId: cseDept._id,
      batchId: batch._id,
      currentClassSectionId: secY4._id,
      currentYearOfStudy: 4,
      currentSection: 'A',
      status: 'Active',
    });
  }

  const students = await Student.insertMany(studentDocs);
  console.log(`[Seed] Inserted ${students.length} students.`);

  console.log('[Seed] Creating 4-Year StudentAcademicHistory for each student...');
  const academicHistories: any[] = [];
  const placementProfiles: any[] = [];

  students.forEach((st, idx) => {
    // 4 academic history records per student
    academicHistories.push(
      { studentId: st._id, academicYearId: ay1._id, batchId: batch._id, departmentId: cseDept._id, yearOfStudy: 1, section: 'A', rollNumber: st.rollNumber, classSectionId: secY1._id, status: 'Promoted' },
      { studentId: st._id, academicYearId: ay2._id, batchId: batch._id, departmentId: cseDept._id, yearOfStudy: 2, section: 'A', rollNumber: st.rollNumber, classSectionId: secY2._id, status: 'Promoted' },
      { studentId: st._id, academicYearId: ay3._id, batchId: batch._id, departmentId: cseDept._id, yearOfStudy: 3, section: 'A', rollNumber: st.rollNumber, classSectionId: secY3._id, status: 'Promoted' },
      { studentId: st._id, academicYearId: ay4._id, batchId: batch._id, departmentId: cseDept._id, yearOfStudy: 4, section: 'A', rollNumber: st.rollNumber, classSectionId: secY4._id, status: 'Current' }
    );

    // Placement profile
    const cgpa = Number((7.0 + (idx % 28) * 0.1).toFixed(2));
    const activeBacklogs = idx === 5 || idx === 18 ? 1 : 0;
    const readiness = activeBacklogs > 0 ? 58 : Math.min(96, Math.round(cgpa * 10 + 3));

    placementProfiles.push({
      studentId: st._id,
      cgpa,
      activeBacklogs,
      historyOfBacklogs: activeBacklogs,
      githubUrl: `https://github.com/student${st.rollNumber}`,
      linkedinUrl: `https://linkedin.com/in/student${st.rollNumber}`,
      preferredRoles: ['Full Stack Developer', 'Software Engineer', 'Data Analyst'],
      skills: [
        { name: 'Java', category: 'Programming', proficiency: 'Advanced', verified: true },
        { name: 'SQL', category: 'Database', proficiency: 'Intermediate', verified: true },
        { name: 'Python', category: 'Programming', proficiency: 'Intermediate', verified: true },
        { name: 'Problem Solving', category: 'Aptitude', proficiency: 'Advanced', verified: true },
      ],
      certifications: [
        { title: 'Oracle Certified Associate - Java SE 8', issuer: 'Oracle', issueDate: new Date('2025-03-10') },
      ],
      readinessScore: readiness,
      placementStatus: idx === 0 || idx === 1 ? 'Placed' : 'Not Placed',
      placedCompany: idx === 0 ? 'Microsoft IDC' : idx === 1 ? 'Amazon AWS' : undefined,
      packageLPA: idx === 0 ? 18.5 : idx === 1 ? 16.0 : undefined,
    });
  });

  await StudentAcademicHistory.insertMany(academicHistories);
  await PlacementProfile.insertMany(placementProfiles);
  console.log(`[Seed] Created ${academicHistories.length} academic history snapshots & placement profiles.`);

  console.log('[Seed] Creating 10 Training Programs across Years 1 to 4...');
  const programsData = [
    // Year 1 (2023-24)
    {
      title: 'Aptitude Training',
      code: 'TR-Y1-APT',
      categoryId: catApt._id,
      academicYearId: ay1._id,
      targetYears: [1],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Prof. Ramesh K (Ethnus Academy)',
      startDate: new Date('2023-08-10'),
      endDate: new Date('2023-09-15'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 1,
    },
    {
      title: 'Communication',
      code: 'TR-Y1-COMM',
      categoryId: catSoft._id,
      academicYearId: ay1._id,
      targetYears: [1],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Dr. Sarah Wilson (Language Lab)',
      startDate: new Date('2023-10-05'),
      endDate: new Date('2023-11-10'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 1,
    },
    {
      title: 'Coding Basics',
      code: 'TR-Y1-CODE',
      categoryId: catCode._id,
      academicYearId: ay1._id,
      targetYears: [1],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Er. Rajesh V (CodeTantra)',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-02-28'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 1,
    },
    // Year 2 (2024-25)
    {
      title: 'Java Training',
      code: 'TR-Y2-JAVA',
      categoryId: catCode._id,
      academicYearId: ay2._id,
      targetYears: [2],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Mr. Arvind Swamy (Sun Certified)',
      startDate: new Date('2024-08-12'),
      endDate: new Date('2024-09-30'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 80,
      year: 2,
    },
    {
      title: 'SQL Training',
      code: 'TR-Y2-SQL',
      categoryId: catTech._id,
      academicYearId: ay2._id,
      targetYears: [2],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Ms. Deepa Natarajan (DBA Lead)',
      startDate: new Date('2024-10-15'),
      endDate: new Date('2024-11-20'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 2,
    },
    {
      title: 'GD Training',
      code: 'TR-Y2-GD',
      categoryId: catSoft._id,
      academicYearId: ay2._id,
      targetYears: [2],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Col. Sanjeev Rawat (Corporate Coach)',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-02-15'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 2,
    },
    // Year 3 (2025-26)
    {
      title: 'Python Training',
      code: 'TR-Y3-PY',
      categoryId: catCode._id,
      academicYearId: ay3._id,
      targetYears: [3],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Mr. Prateek Narang (AlgoPrep)',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-09-10'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 3,
    },
    {
      title: 'Mock Interview',
      code: 'TR-Y3-MOCK',
      categoryId: catMock._id,
      academicYearId: ay3._id,
      targetYears: [3],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Placement Panel & Alumni Network',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-25'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 80,
      year: 3,
    },
    {
      title: 'Resume Training',
      code: 'TR-Y3-RESUME',
      categoryId: catSoft._id,
      academicYearId: ay3._id,
      targetYears: [3],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Ms. Tanya Sen (HR Talent Partner)',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-01-28'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 3,
    },
    // Year 4 (2026-27 - Current)
    {
      title: 'Advanced Java',
      code: 'TR-Y4-ADJAVA',
      categoryId: catTech._id,
      academicYearId: ay4._id,
      targetYears: [4],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Mr. Arvind Swamy (Senior Architect)',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-08-25'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 80,
      year: 4,
    },
    {
      title: 'Aptitude Revision',
      code: 'TR-Y4-APTREV',
      categoryId: catApt._id,
      academicYearId: ay4._id,
      targetYears: [4],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Prof. Ramesh K (Ethnus Academy)',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-09-10'),
      status: PROGRAM_STATUS.COMPLETED,
      minAttendanceThreshold: 75,
      year: 4,
    },
    {
      title: 'HR Training',
      code: 'TR-Y4-HR',
      categoryId: catSoft._id,
      academicYearId: ay4._id,
      targetYears: [4],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Corporate HR Leadership Forum',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-20'),
      status: PROGRAM_STATUS.ONGOING,
      minAttendanceThreshold: 75,
      year: 4,
    },
    {
      title: 'Mock Interview Final',
      code: 'TR-Y4-MOCK26',
      categoryId: catMock._id,
      academicYearId: ay4._id,
      targetYears: [4],
      targetDepartmentIds: [cseDept._id],
      targetSections: ['A'],
      trainerName: 'Industry Tech Leads & HR Directors',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-20'),
      status: PROGRAM_STATUS.SCHEDULED,
      minAttendanceThreshold: 80,
      year: 4,
    },
  ];

  const createdPrograms = [];
  for (const p of programsData) {
    const prog = await TrainingProgram.create({
      ...p,
      targetBatchIds: [batch._id],
    });
    createdPrograms.push({ prog, year: p.year });
  }
  console.log(`[Seed] Created ${createdPrograms.length} training programs.`);

  // Create default users (Placement Officer, Faculty, Class Incharge, Student)
  console.log('[Seed] Creating demo accounts for all 4 roles...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const facultyHash = await bcrypt.hash('Faculty@123', 10);
  const inchargeHash = await bcrypt.hash('Incharge@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  const officerUser = await User.create({
    email: 'officer@placerise.edu',
    passwordHash,
    name: 'Dr. S. K. Subramanian (Placement Director)',
    role: ROLES.PLACEMENT_OFFICER,
    departmentId: cseDept._id,
    permissions: ['*'],
    isActive: true,
  });

  const hodUser = await User.create({
    email: 'hod.cse@placerise.edu',
    passwordHash,
    name: 'Dr. R. Meenakshi (Head of Department - CSE)',
    role: ROLES.HOD,
    departmentId: cseDept._id,
    permissions: [
      'view_department_matrix',
      'manage_department_training',
      'approve_requests',
      'view_audit_trail',
      'export_reports',
    ],
    isActive: true,
  });

  const facultyUser = await User.create({
    email: 'faculty@placerise.edu',
    passwordHash: facultyHash,
    name: 'Prof. Ananth Krishnan',
    role: ROLES.FACULTY,
    departmentId: cseDept._id,
    permissions: ['manage_assigned_training', 'mark_attendance', 'submit_assessments'],
    isActive: true,
  });

  const inchargeUser = await User.create({
    email: 'incharge@placerise.edu',
    passwordHash: inchargeHash,
    name: 'Dr. Malathi Ramesh (IV CSE A Incharge)',
    role: ROLES.CLASS_INCHARGE,
    departmentId: cseDept._id,
    assignedSectionId: secY4._id,
    permissions: ['view_class_matrix', 'mark_class_attendance', 'submit_approval_request'],
    isActive: true,
  });

  // Attach faculty incharge to section IV CSE A
  secY4.facultyInchargeId = inchargeUser._id as any;
  await secY4.save();

  // Create student user account for Student 01 (Aarav Sharma)
  const studentUser = await User.create({
    email: 'student@placerise.edu',
    passwordHash: studentHash,
    name: 'Aarav Sharma (Student 01)',
    role: ROLES.STUDENT,
    studentId: students[0]._id as any,
    departmentId: cseDept._id,
    assignedSectionId: secY4._id,
    permissions: ['view_own_journey', 'edit_placement_profile'],
    isActive: true,
  });

  console.log('[Seed] Generating enrollments, sessions, attendance & assessment marks for 50 students...');
  const allEnrollments: any[] = [];
  const allAttendanceRecords: any[] = [];
  const allAssessments: any[] = [];
  const allAssessmentResults: any[] = [];

  for (const { prog, year } of createdPrograms) {
    // 2-3 sessions per completed/ongoing program
    const sessionCount = prog.status === PROGRAM_STATUS.SCHEDULED ? 0 : 3;
    const sessions = [];
    for (let s = 1; s <= sessionCount; s++) {
      const sessDate = new Date(prog.startDate.getTime() + s * 86400000 * 3);
      const session = await TrainingSession.create({
        trainingProgramId: prog._id,
        sessionNumber: s,
        title: `${prog.title} - Session ${s}`,
        sessionDate: sessDate,
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        durationHours: 2,
        trainer: prog.trainerName,
        topicsCovered: `Key modules and practical drills for ${prog.title}`,
        isCompleted: prog.status === PROGRAM_STATUS.COMPLETED || s < 3,
      });
      sessions.push(session);
    }

    // 1 assessment per completed program
    let assessmentDoc: any = null;
    if (prog.status === PROGRAM_STATUS.COMPLETED) {
      assessmentDoc = await Assessment.create({
        trainingProgramId: prog._id,
        title: `${prog.title} Final Evaluation`,
        type: prog.categoryId.toString() === catCode._id.toString() ? ASSESSMENT_TYPE.CODING : ASSESSMENT_TYPE.QUIZ,
        maxMarks: 100,
        passingMarks: 50,
        date: new Date(prog.endDate.getTime() - 86400000),
        durationMinutes: 90,
        createdBy: facultyUser._id,
        isCompleted: true,
      });
      allAssessments.push(assessmentDoc);
    }

    // Enroll all 50 students into this program
    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Realistic variation:
      // Student 01 (index 0): Top performer - attends everything
      // Student 02 (index 1): Missed SQL & Mock
      // Student 03 (index 2): Missed Coding Basics & HR
      // Other students have realistic spread: ~85% attendance on average
      let isAbsentInProg = false;
      if (i === 0) {
        isAbsentInProg = false;
      } else if (i === 1 && (prog.code === 'TR-Y2-SQL' || prog.code === 'TR-Y3-MOCK')) {
        isAbsentInProg = true;
      } else if (i === 2 && (prog.code === 'TR-Y1-CODE' || prog.code === 'TR-Y4-HR')) {
        isAbsentInProg = true;
      } else if (prog.code === 'TR-Y1-CODE' && (i === 6 || i === 14 || i === 22 || i === 31)) {
        isAbsentInProg = true;
      } else if (prog.code === 'TR-Y2-GD' && (i === 5 || i === 12 || i === 25)) {
        isAbsentInProg = true;
      } else if (prog.code === 'TR-Y4-HR' && (i === 3 || i === 8 || i === 19 || i === 29 || i === 41)) {
        isAbsentInProg = true;
      }

      let attendedSessionsCount = 0;
      sessions.forEach((sess) => {
        const isPresent = !isAbsentInProg && (i === 0 || (i + sess.sessionNumber) % 8 !== 0);
        if (isPresent) attendedSessionsCount++;

        allAttendanceRecords.push({
          trainingSessionId: sess._id,
          trainingProgramId: prog._id,
          studentId: student._id,
          academicYearId: prog.academicYearId,
          yearOfStudy: year,
          date: sess.sessionDate,
          status: isPresent ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT,
          remarks: isPresent ? 'Attended full session' : 'Absent without leave',
          markedBy: facultyUser._id,
        });
      });

      const attendanceRate = sessionCount > 0 ? Math.round((attendedSessionsCount / sessionCount) * 100) : 0;
      const isCompleted = prog.status === PROGRAM_STATUS.SCHEDULED ? false : attendanceRate >= (prog.minAttendanceThreshold || 75);

      // Assessment result
      let testScore = 0;
      if (assessmentDoc) {
        if (isAbsentInProg) {
          testScore = 38; // Failed
        } else {
          testScore = Math.min(98, 65 + ((i * 7) % 33));
        }

        const percentage = testScore;
        const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'F';
        const passStatus = percentage >= 50 ? 'Passed' : 'Failed';

        allAssessmentResults.push({
          assessmentId: assessmentDoc._id,
          trainingProgramId: prog._id,
          studentId: student._id,
          academicYearId: prog.academicYearId,
          yearOfStudy: year,
          marksObtained: testScore,
          maxMarks: 100,
          percentage,
          grade,
          status: passStatus,
          remarks: passStatus === 'Passed' ? 'Demonstrated strong proficiency' : 'Requires remedial training',
          evaluatedBy: facultyUser._id,
          evaluatedAt: assessmentDoc.date,
        });
      }

      allEnrollments.push({
        trainingProgramId: prog._id,
        studentId: student._id,
        academicYearId: prog.academicYearId,
        yearOfStudy: year,
        status: prog.status === PROGRAM_STATUS.SCHEDULED
          ? ENROLLMENT_STATUS.ENROLLED
          : isCompleted
          ? ENROLLMENT_STATUS.COMPLETED
          : ENROLLMENT_STATUS.INCOMPLETE,
        attendancePercentage: attendanceRate,
        assessmentAverage: testScore,
        hasGap: !isCompleted && prog.status !== PROGRAM_STATUS.SCHEDULED,
      });
    }
  }

  await TrainingEnrollment.insertMany(allEnrollments);
  await AttendanceRecord.insertMany(allAttendanceRecords);
  await AssessmentResult.insertMany(allAssessmentResults);

  console.log(`[Seed] Successfully inserted:`);
  console.log(`- ${allEnrollments.length} enrollments`);
  console.log(`- ${allAttendanceRecords.length} attendance records`);
  console.log(`- ${allAssessmentResults.length} assessment results`);

  console.log('\n=============================================================');
  console.log(' SEED COMPLETE! Default Login Credentials:');
  console.log(' 1. Placement Officer: officer@placerise.edu   / Admin@123');
  console.log(' 2. Head of Dept (HOD): hod.cse@placerise.edu  / Admin@123');
  console.log(' 3. Faculty:           faculty@placerise.edu   / Faculty@123');
  console.log(' 4. Class Incharge:    incharge@placerise.edu  / Incharge@123');
  console.log(' 5. Student:           student@placerise.edu   / Student@123');
  console.log('=============================================================\n');
}

// Auto-run if executed directly
if (process.argv[1]?.includes('seed')) {
  runSeed().then(() => {
    console.log('[Seed] Database seeded successfully.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });
}
