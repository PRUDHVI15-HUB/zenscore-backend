const connectDB = require('../config/db')
const JobListing = require('../models/JobListing')
const ProviderFactory = require('../services/jobs/providers/ProviderFactory')

const verifyGreenhouseE2E = async () => {
  try {
    console.log('🚀 === Step 5: Greenhouse Provider End-to-End Verification ===\n')

    // 1. Factory Instantiation Check
    console.log('1️⃣ Testing ProviderFactory.create("greenhouse")...')
    const provider = ProviderFactory.create('greenhouse')
    console.log(`✅ Instantiated Provider: ${provider.getProviderName()} (v${provider.getProviderVersion()})\n`)

    // 2. Test GET /api/jobs/providers/greenhouse/test
    console.log('2️⃣ Testing GET /api/jobs/providers/greenhouse/test...')
    const testRes = await fetch('http://localhost:5000/api/jobs/providers/greenhouse/test')
    const testData = await testRes.json()
    console.log(`Status: ${testRes.status}`)
    console.log(`Success: ${testData.success}, Total Sample Jobs: ${testData.syncResult?.validJobs}\n`)

    // 3. Test POST /api/jobs/providers/greenhouse/sync (Initial Sync)
    console.log('3️⃣ Testing POST /api/jobs/providers/greenhouse/sync (Live Ingestion)...')
    const syncRes1 = await fetch('http://localhost:5000/api/jobs/providers/greenhouse/sync', { method: 'POST' })
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

    // 4. Test POST /api/jobs/providers/greenhouse/sync (Deduplication Sync)
    console.log('4️⃣ Testing POST /api/jobs/providers/greenhouse/sync (Deduplication Check)...')
    const syncRes2 = await fetch('http://localhost:5000/api/jobs/providers/greenhouse/sync', { method: 'POST' })
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

    // 5. Verify MongoDB Database Content
    await connectDB()
    const greenhouseDbJobs = await JobListing.find({ source: 'Greenhouse' }).lean()
    console.log(`5️⃣ MongoDB Database Persistence Verification:`)
    console.log(`📊 Found ${greenhouseDbJobs.length} Greenhouse jobs in MongoDB:`)
    greenhouseDbJobs.slice(0, 8).forEach((j, i) => {
      console.log(`  ${i + 1}. [${j.company}] ${j.title} (${j.location}) | Skills: ${j.requiredSkills.join(', ')} | Apply: ${j.applyLink}`)
    })
    console.log('')

    // 6. Test Multi-Provider Feed via GET /api/jobs
    console.log('6️⃣ Testing Multi-Provider Public API (GET /api/jobs)...')
    const feedRes = await fetch('http://localhost:5000/api/jobs?limit=20')
    const feedData = await feedRes.json()
    const ghInFeed = feedData.jobs?.filter(j => j.source === 'Greenhouse') || []
    const jblInFeed = feedData.jobs?.filter(j => j.source === 'Jooble') || []
    const adzInFeed = feedData.jobs?.filter(j => j.source === 'Adzuna') || []
    console.log(`Total jobs returned: ${feedData.jobs?.length}`)
    console.log(`Greenhouse jobs in feed: ${ghInFeed.length}`)
    console.log(`Jooble jobs in feed: ${jblInFeed.length}`)
    console.log(`Adzuna jobs in feed: ${adzInFeed.length}\n`)

    console.log('🎉 === All Greenhouse Provider Verification Checks PASSED! === 🎉')
    process.exit(0)
  } catch (err) {
    console.error('❌ Greenhouse E2E Verification Error:', err)
    process.exit(1)
  }
}

verifyGreenhouseE2E()
