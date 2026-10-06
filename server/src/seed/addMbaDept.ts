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
      // 3. Upsert Class Section for I MBA and II MBA (Only 1st and 2nd Year, no separate section code)
      let sec1 = await ClassSection.findOne({
        departmentId: mbaDept._id,
        yearOfStudy: 1,
      });

      if (!sec1) {
        sec1 = await ClassSection.create({
          academicYearId: currentYear._id,
          departmentId: mbaDept._id,
          batchId: batch._id,
          yearOfStudy: 1,
          section: 'A',
          displayName: 'I MBA A',
        });
        console.log('[Migration] Created Class Section: I MBA A.');
      } else {
        sec1.section = 'A';
        sec1.displayName = 'I MBA A';
        await sec1.save();
        console.log('[Migration] Updated Class Section 1 to: I MBA A.');
      }

      let sec2 = await ClassSection.findOne({
        departmentId: mbaDept._id,
        yearOfStudy: 2,
      });

      if (!sec2) {
        sec2 = await ClassSection.create({
          academicYearId: currentYear._id,
          departmentId: mbaDept._id,
          batchId: batch._id,
          yearOfStudy: 2,
          section: 'A',
          displayName: 'II MBA A',
        });
        console.log('[Migration] Created Class Section: II MBA A.');
      } else {
        sec2.section = 'A';
        sec2.displayName = 'II MBA A';
        await sec2.save();
        console.log('[Migration] Updated Class Section 2 to: II MBA A.');
      }

      // Ensure no MBA sections exist beyond 2nd year
      const removed = await ClassSection.deleteMany({
        departmentId: mbaDept._id,
        yearOfStudy: { $gt: 2 },
      });
      if (removed.deletedCount > 0) {
        console.log(`[Migration] Removed ${removed.deletedCount} invalid MBA section(s) > Year 2.`);
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
