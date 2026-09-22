import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = 'mongodb://127.0.0.1:27017/placerise';
const CLOUD_URI = process.env.MONGODB_URI;

if (!CLOUD_URI) {
  console.error('ERROR: MONGODB_URI is not defined in server/.env');
  process.exit(1);
}

const targetCloudUri: string = CLOUD_URI;

// Collections to migrate (Institutional metadata & structure, excluding users and training datas)
const COLLECTIONS_TO_MIGRATE = [
  'departments',
  'academicyears',
  'batches',
  'trainingcategories',
  'systemsettings',
  'classsections',
];

async function migrateData() {
  console.log('====================================================');
  console.log(' MIGRATING DATA FROM LOCAL TO CLOUD MONGODB');
  console.log(` From:  ${LOCAL_URI}`);
  console.log(` To:    ${targetCloudUri.split('@')[1] ? 'MongoDB Atlas (' + targetCloudUri.split('@')[1].split('/')[0] + ')' : targetCloudUri}`);
  console.log('====================================================\n');

  try {
    console.log('Connecting to Local DB...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connected to Local DB.\n');

    console.log('Connecting to Cloud DB...');
    const cloudConn = await mongoose.createConnection(targetCloudUri).asPromise();
    console.log('Connected to Cloud DB.\n');

    const localDb = localConn.db!;
    const cloudDb = cloudConn.db!;

    for (const colName of COLLECTIONS_TO_MIGRATE) {
      console.log(`--- Processing Collection: [${colName}] ---`);
      const localCol = localDb.collection(colName);
      const cloudCol = cloudDb.collection(colName);

      const docs = await localCol.find({}).toArray();
      console.log(`Found ${docs.length} document(s) in local [${colName}].`);

      if (docs.length === 0) {
        console.log(`Skipping [${colName}] as it has 0 documents.\n`);
        continue;
      }

      // For classsections: clean facultyInchargeId to avoid broken references to deleted demo users
      const preparedDocs = docs.map((doc) => {
        if (colName === 'classsections') {
          const { facultyInchargeId, ...rest } = doc;
          return rest;
        }
        return doc;
      });

      // Clear existing records in cloud for this collection to avoid duplicates
      const deleteResult = await cloudCol.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount} existing cloud document(s) from [${colName}].`);

      // Insert migrated documents
      const insertResult = await cloudCol.insertMany(preparedDocs);
      console.log(`Successfully migrated ${insertResult.insertedCount} document(s) to cloud [${colName}].\n`);
    }

    console.log('====================================================');
    console.log(' VERIFYING CLOUD DATABASE STATE');
    console.log('====================================================');
    const cloudCollections = await cloudDb.listCollections().toArray();
    for (const col of cloudCollections) {
      const count = await cloudDb.collection(col.name).countDocuments();
      console.log(`Cloud Collection: ${col.name.padEnd(25)} -> Count: ${count}`);
    }

    // Verify user placement@marephraem.edu.in is intact
    const cloudUsers = await cloudDb.collection('users').find({}).toArray();
    console.log('\nCloud Users:');
    cloudUsers.forEach((u) => {
      console.log(` - ${u.name} (${u.email}) [Role: ${u.role}]`);
    });

    await localConn.close();
    await cloudConn.close();
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

migrateData();
