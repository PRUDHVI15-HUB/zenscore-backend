const mongoose = require('mongoose')
require('dotenv').config({ path: 'c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/.env' })
const JobListing = require('c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/models/JobListing')

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    const totalDocs = await JobListing.countDocuments({})
    const activeDocs = await JobListing.countDocuments({ status: 'active' })
    const sample = await JobListing.findOne()
    console.log('Total Docs:', totalDocs)
    console.log('Active Docs:', activeDocs)
    console.log('Sample Document:', sample)

    const internships = await JobListing.countDocuments({
      $or: [
        { employmentType: /intern/i },
        { title: /intern/i },
        { workMode: /intern/i }
      ]
    })
    const distinctCompanies = await JobListing.distinct('company')
    console.log('Internships:', internships)
    console.log('Distinct Companies Count:', distinctCompanies.length)

    await mongoose.disconnect()
  } catch (err) {
    console.error(err)
  }
}
run()
