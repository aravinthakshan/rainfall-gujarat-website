const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in environment variables.');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!');
  const collection = mongoose.connection.db.collection('rainfalldatas');

  // Find all documents where date contains a dot
  const docs = await collection.find({ date: { $regex: '\\.' } }).toArray();
  console.log(`Found ${docs.length} documents with dot in date.`);
  let updatedCount = 0;

  for (const [i, doc] of docs.entries()) {
    const oldDate = doc.date;
    const newDate = oldDate.replace(/\./g, '/');
    if (oldDate !== newDate) {
      await collection.updateOne({ _id: doc._id }, { $set: { date: newDate } });
      updatedCount++;
      console.log(`[${i + 1}/${docs.length}] Updated: ${oldDate} -> ${newDate}`);
    } else {
      console.log(`[${i + 1}/${docs.length}] No change needed: ${oldDate}`);
    }
  }

  console.log(`Total documents updated: ${updatedCount}`);
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
}); 