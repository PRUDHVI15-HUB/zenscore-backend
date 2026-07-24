const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/.env' });
const ImportSession = require('../models/ImportSession');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const sessions = await ImportSession.find({}).sort({ createdAt: -1 }).limit(3);
    for (let i = 0; i < sessions.length; i++) {
      console.log(`SESSION ${i + 1}: ID=${sessions[i]._id}, status=${sessions[i].status}, confidence=${sessions[i].confidence}, filename=${sessions[i].fileMetadata?.name}`);
      console.log('--- EXTRACTED TEXT ---');
      console.log(sessions[i].extractedText);
      console.log('--- PARSED DATA ---');
      console.log(JSON.stringify(sessions[i].parsedData, null, 2));
      console.log('=== END SESSION ===\n');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
