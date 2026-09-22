import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

dotenv.config();

async function checkStatus() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection not established.');
    process.exit(1);
  }

  console.log(`Connected Database Name: ${db.databaseName}`);

  const collections = await db.listCollections().toArray();
  console.log('\n--- Database Collections & Document Counts ---');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count}`);
  }

  const users = await db.collection('users').find({}).toArray();
  console.log('\n--- Current Users in Database ---');
  users.forEach((u) => {
    console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });
  console.log(`Total users found: ${users.length}`);
  console.log('------------------------------------------------\n');
  process.exit(0);
}

checkStatus();
