require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to DB');

  const userId = '6a869cb032ae3175536eac65';

  const academic = await mongoose.connection.collection('academicrecords').findOne({ user: new mongoose.Types.ObjectId(userId) });
  console.log('--- AcademicRecord ---');
  if (academic) {
    console.log('currentCGPA:', academic.currentCGPA);
    console.log('targetCGPA:', academic.targetCGPA);
    console.log('predictedCGPA:', academic.predictedCGPA);
    console.log('totalCredits:', academic.totalCredits);
    console.log('semesters count:', academic.semesters?.length);
    console.log('sample subject attendance:', academic.semesters?.[0]?.subjects?.[0]?.attendance);
  } else {
    console.log('None found');
  }

  const profile = await mongoose.connection.collection('studentprofiles').findOne({ user: new mongoose.Types.ObjectId(userId) });
  console.log('--- StudentProfile ---');
  if (profile) {
    console.log('academicSummary:', JSON.stringify(profile.academicSummary, null, 2));
  } else {
    console.log('None found');
  }

  const career = await mongoose.connection.collection('careerprofiles').findOne({ user: new mongoose.Types.ObjectId(userId) });
  console.log('--- CareerProfile ---');
  if (career) {
    console.log('academicHealth:', career.academicHealth);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
