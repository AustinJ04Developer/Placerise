import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/placerise';

async function analyzeLocal() {
  try {
    console.log(`Connecting to local MongoDB: ${LOCAL_URI}...`);
    const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connected successfully to local MongoDB!\n');

    const db = conn.db!;
    const collections = await db.listCollections().toArray();
    console.log('=== LOCAL COLLECTIONS AND COUNTS ===');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`Collection: ${col.name} -> Count: ${count}`);
    }

    console.log('\n=== SAMPLE INSPECTION OF NON-USER & NON-TRAINING COLLECTIONS ===');
    for (const col of collections) {
      const name = col.name.toLowerCase();
      // Check if it's user or training
      const isUserOrTraining = name.includes('user') || name.includes('train') || name.includes('attend') || name.includes('assess');
      if (!isUserOrTraining) {
        const count = await db.collection(col.name).countDocuments();
        if (count > 0) {
          const sample = await db.collection(col.name).findOne({});
          console.log(`\nSample from [${col.name}] (Total ${count}):`);
          console.log(JSON.stringify(sample, null, 2));
        }
      }
    }

    await conn.close();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to or analyzing local MongoDB:', err);
    process.exit(1);
  }
}

analyzeLocal();
