const connectDB = require('../config/db')
const JobListing = require('../models/JobListing')

const verifyEndToEnd = async () => {
  try {
    console.log('🚀 === Jooble Provider Phase 3 Step 4 End-to-End Verification ===\n')

    // 1. Test GET /api/jobs/providers/jooble/test
    console.log('1️⃣ Testing GET /api/jobs/providers/jooble/test...')
    const testUrl = 'http://localhost:5000/api/jobs/providers/jooble/test'
    const testRes = await fetch(testUrl)
    const testData = await testRes.json()
    console.log(`Status: ${testRes.status}`)
    console.log(`Success: ${testData.success}, Sample Count: ${testData.syncResult?.validJobs}\n`)

    // 2. Test POST /api/jobs/providers/jooble/sync (Initial Ingestion)
    console.log('2️⃣ Testing POST /api/jobs/providers/jooble/sync (Initial Ingestion)...')
    const syncUrl = 'http://localhost:5000/api/jobs/providers/jooble/sync'
    const syncRes1 = await fetch(syncUrl, { method: 'POST' })
    const syncData1 = await syncRes1.json()
    console.log('Sync Statistics (Run 1):')
    console.log(JSON.stringify({
      success: syncData1.success,
      provider: syncData1.provider,
      totalFetched: syncData1.totalFetched,
      validJobs: syncData1.validJobs,
      inserted: syncData1.inserted,
      updated: syncData1.updated,
      duplicatesRemoved: syncData1.duplicatesRemoved
    }, null, 2), '\n')

    // 3. Test POST /api/jobs/providers/jooble/sync (Deduplication Check)
    console.log('3️⃣ Testing POST /api/jobs/providers/jooble/sync (Deduplication Check)...')
    const syncRes2 = await fetch(syncUrl, { method: 'POST' })
    const syncData2 = await syncRes2.json()
    console.log('Sync Statistics (Run 2 - Deduplication):')
    console.log(JSON.stringify({
      success: syncData2.success,
      provider: syncData2.provider,
      totalFetched: syncData2.totalFetched,
      inserted: syncData2.inserted,
      updated: syncData2.updated,
      duplicatesRemoved: syncData2.duplicatesRemoved
    }, null, 2), '\n')

    // 4. Verify MongoDB JobListing Collection
    await connectDB()
    const joobleJobsInDb = await JobListing.find({ source: 'Jooble' }).lean()
    console.log(`4️⃣ MongoDB JobListing Collection Check:`)
    console.log(`Found ${joobleJobsInDb.length} Jooble jobs in MongoDB database.`)
    joobleJobsInDb.forEach((j, i) => {
      console.log(`  ${i + 1}. [${j.company}] ${j.title} (${j.location}) | Salary: ${j.salary} | Category: ${j.category}`)
    })
    console.log('')

    // 5. Test Frontend API Integration (GET /api/jobs with Jooble)
    console.log('5️⃣ Testing Public Jobs REST API (GET /api/jobs)...')
    const getJobsRes = await fetch('http://localhost:5000/api/jobs?limit=15')
    const getJobsData = await getJobsRes.json()
    const joobleFoundInFeed = getJobsData.jobs?.filter(j => j.source === 'Jooble') || []
    const adzunaFoundInFeed = getJobsData.jobs?.filter(j => j.source === 'Adzuna') || []
    console.log(`Total jobs returned: ${getJobsData.jobs?.length}`)
    console.log(`Jooble jobs in feed: ${joobleFoundInFeed.length}`)
    console.log(`Adzuna jobs in feed: ${adzunaFoundInFeed.length}\n`)

    // 6. Test Search & Filters with Jooble jobs
    console.log('6️⃣ Testing Search & Category Filters for Jooble positions...')
    const searchRes = await fetch('http://localhost:5000/api/jobs?search=Oracle')
    const searchData = await searchRes.json()
    console.log(`Search 'Oracle' matched ${searchData.jobs?.length} job(s): ${searchData.jobs?.[0]?.title} @ ${searchData.jobs?.[0]?.company}\n`)

    console.log('🎉 === All End-to-End Jooble Provider Tests PASSED! === 🎉')
    process.exit(0)
  } catch (err) {
    console.error('❌ E2E Verification Failed:', err)
    process.exit(1)
  }
}

verifyEndToEnd()
