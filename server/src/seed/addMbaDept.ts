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

async function addMbaDepartment() {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected to MongoDB:', MONGODB_URI.includes('@') ? 'MongoDB Atlas' : MONGODB_URI);

    // 1. Upsert Master of Business Administration Department
    let mbaDept = await Department.findOne({ code: 'MBA' });
    if (!mbaDept) {
      mbaDept = await Department.create({
        code: 'MBA',
        name: 'Master of Business Administration',
        isActive: true,
      });
      console.log('[Migration] Created Master of Business Administration Department (MBA).');
    } else {
      mbaDept.name = 'Master of Business Administration';
      mbaDept.isActive = true;
      await mbaDept.save();
      console.log('[Migration] Updated existing MBA department.');
    }

    // 2. Ensure Academic Years & Batch exist
    const currentYear = (await AcademicYear.findOne({ isCurrent: true })) || (await AcademicYear.findOne().sort({ order: -1 }));
    const batch = (await Batch.findOne({ isActive: true })) || (await Batch.findOne().sort({ endYear: -1 }));

    if (currentYear && batch) {
      // 3. Upsert Class Section for I MBA A
      const existingSec = await ClassSection.findOne({
        departmentId: mbaDept._id,
        displayName: 'I MBA A',
      });

      if (!existingSec) {
        await ClassSection.create({
          academicYearId: currentYear._id,
          departmentId: mbaDept._id,
          batchId: batch._id,
          yearOfStudy: 1,
          section: 'A',
          displayName: 'I MBA A',
        });
        console.log('[Migration] Created Class Section: I MBA A.');
      }
    }

    // 4. Optionally ensure an HOD account exists for MBA department
    const existingHod = await User.findOne({ email: 'hod.mba@placerise.edu' });
    if (!existingHod) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await User.create({
        email: 'hod.mba@placerise.edu',
        passwordHash,
        name: 'Dr. Suresh Kumar (HOD MBA)',
        role: ROLES.HOD,
        departmentId: mbaDept._id,
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
      console.log('[Migration] Created HOD account for MBA: hod.mba@placerise.edu (Dr. Suresh Kumar).');
    }

    console.log('[Migration] Successfully added Master of Business Administration (MBA) Department!');
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
}

addMbaDepartment();
