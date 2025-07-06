// test-mongo.js
const mongoose = require('mongoose');
const uri = 'mongodb+srv://aravinth:sahlt2j03Damwzse@blogsmarkdown.66vqnyy.mongodb.net/rainfall-data?retryWrites=true&w=majority&appName=BlogsMarkdown';

mongoose.connect(uri).then(async () => {
  const docs = await mongoose.connection.db.collection('rainfalldatas').distinct('date');
  console.log(docs);
  process.exit();
});