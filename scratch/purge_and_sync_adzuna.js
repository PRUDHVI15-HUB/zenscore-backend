require('dotenv').config()
const connectDB = require('../config/db')
const JobListing = require('../models/JobListing')
const { syncJobsFromProvider } = require('../services/jobs/sync/syncJobs')

const main = async () => {
  try {
    await connectDB()
    console.log('Connected to MongoDB...')

    // 1. Purge all dummy non-Adzuna jobs
    const deleted = await JobListing.deleteMany({
      $or: [
        { source: { $exists: false } },
        { source: 'ZenScore' },
        { source: 'MockProvider' }
      ]
    })
    console.log(`🧹 Successfully purged ${deleted.deletedCount} dummy mock jobs from MongoDB.`)

    // 2. Perform live Adzuna sync
    console.log('🚀 Triggering live Adzuna sync pipeline...')
    const result = await syncJobsFromProvider('adzuna', { persistToDb: true })
    console.log('✨ Live Sync Complete:')
    console.log(JSON.stringify(result, null, 2))

    // 3. Print remaining live jobs count
    const totalCount = await JobListing.countDocuments()
    console.log(`📊 Total Live Jobs in MongoDB now: ${totalCount}`)

    process.exit(0)
  } catch (err) {
    console.error('❌ Error during purge and sync:', err)
    process.exit(1)
  }
}

main()
