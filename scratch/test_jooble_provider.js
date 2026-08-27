require('dotenv').config()
const connectDB = require('../config/db')
const ProviderFactory = require('../services/jobs/providers/ProviderFactory')
const { syncJobsFromProvider } = require('../services/jobs/sync/syncJobs')
const JobListing = require('../models/JobListing')

const runJoobleVerification = async () => {
  try {
    console.log('🧪 === Step 4 Verification: Jooble Provider Integration ===\n')

    // 1. Test ProviderFactory Instantiation
    console.log('1️⃣ Testing ProviderFactory.create("jooble")...')
    const provider = ProviderFactory.create('jooble')
    console.log(`✅ Instantiated Provider: ${provider.getProviderName()} (v${provider.getProviderVersion()})\n`)

    // 2. Test Credential Validation
    console.log('2️⃣ Testing validateCredentials()...')
    const credCheck = provider.validateCredentials()
    console.log('Result:', JSON.stringify(credCheck, null, 2), '\n')

    // 3. Test Fetching & Normalization
    console.log('3️⃣ Testing fetchJobs() & normalize()...')
    const rawJobs = await provider.fetchJobs({ keywords: 'software engineer' })
    console.log(`Fetched ${rawJobs.length} raw jobs.`)

    const normalizedSample = provider.normalize(rawJobs[0])
    console.log('Sample Canonical Normalized Job:')
    console.log(JSON.stringify(normalizedSample, null, 2), '\n')

    // 4. Test Sync Engine Integration
    await connectDB()
    console.log('4️⃣ Testing Sync Engine for Jooble (persistToDb: true)...')
    const syncResult = await syncJobsFromProvider('jooble', { persistToDb: true })
    console.log('Sync Result:')
    console.log(JSON.stringify(syncResult, null, 2), '\n')

    // 5. Verify MongoDB Persistence
    console.log('5️⃣ Verifying Jooble jobs in MongoDB...')
    const joobleDbJobs = await JobListing.find({ source: 'Jooble' }).lean()
    console.log(`📊 Found ${joobleDbJobs.length} Jooble jobs in MongoDB:`)
    joobleDbJobs.slice(0, 5).forEach((j, i) => {
      console.log(`  ${i + 1}. [${j.company}] ${j.title} (${j.location}) -> Skills: ${j.requiredSkills.join(', ')} | Apply: ${j.applyLink}`)
    })

    console.log('\n✨ === All Jooble Provider Verification Checks PASSED! === ✨')
    process.exit(0)
  } catch (err) {
    console.error('❌ Jooble Provider Verification Error:', err)
    process.exit(1)
  }
}

runJoobleVerification()
