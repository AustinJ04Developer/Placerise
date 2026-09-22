import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department } from '../models/Department.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { Batch } from '../models/Batch.js';
import { ClassSection } from '../models/ClassSection.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placerise';

async function addAidsDepartment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected to MongoDB:', MONGODB_URI);

    // 1. Upsert Artificial Intelligence and Data Science Department
    let aidsDept = await Department.findOne({ code: 'AIDS' });
    if (!aidsDept) {
      aidsDept = await Department.create({
        code: 'AIDS',
        name: 'Artificial Intelligence and Data Science',
        isActive: true,
      });
      console.log('[Migration] Created Artificial Intelligence and Data Science Department (AIDS).');
    } else {
      aidsDept.name = 'Artificial Intelligence and Data Science';
      aidsDept.isActive = true;
      await aidsDept.save();
      console.log('[Migration] Updated existing AIDS department.');
    }

    // 2. Ensure Academic Years & Batch exist
    const currentYear = await AcademicYear.findOne({ isCurrent: true }) || await AcademicYear.findOne().sort({ order: -1 });
    const batch = await Batch.findOne({ isActive: true }) || await Batch.findOne().sort({ endYear: -1 });

    if (currentYear && batch) {
      // 3. Upsert Class Section for IV AIDS A
      const existingSec = await ClassSection.findOne({
        departmentId: aidsDept._id,
        displayName: 'IV AIDS A',
      });

      if (!existingSec) {
        await ClassSection.create({
          academicYearId: currentYear._id,
          departmentId: aidsDept._id,
          batchId: batch._id,
          yearOfStudy: 4,
          section: 'A',
          displayName: 'IV AIDS A',
        });
        console.log('[Migration] Created Class Section: IV AIDS A.');
      }
    }

    // 4. Optionally ensure an HOD account exists for AIDS department
    const existingHod = await User.findOne({ email: 'hod.aids@placerise.edu' });
    if (!existingHod) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await User.create({
        email: 'hod.aids@placerise.edu',
        passwordHash,
        name: 'Dr. Anand Kumar (HOD AI&DS)',
        role: ROLES.HOD,
        departmentId: aidsDept._id,
        permissions: [
          'view_department_matrix',
          'view_class_roster',
          'view_training_programs',
          'view_reverse_query',
          'manage_approvals',
          'view_audit_trail',
        ],
        isActive: true,
      });
      console.log('[Migration] Created HOD account for AIDS: hod.aids@placerise.edu (Dr. Anand Kumar).');
    }

    console.log('[Migration] Successfully added Artificial Intelligence and Data Science Department!');
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
}

addAidsDepartment();
