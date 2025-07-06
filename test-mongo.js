// test-mongo.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in environment variables.');
  process.exit(1);
}

mongoose.connect(uri).then(async () => {
  const docs = await mongoose.connection.db.collection('rainfalldatas').distinct('date');
  console.log('Rainfall available dates:', docs);
  process.exit();
});