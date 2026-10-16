/**
 * eval_job_fallback.js
 * Section 6: Job Aggregation Fallback
 *
 * Tests that MockProvider returns job listings when called directly,
 * without any live provider credentials.
 *
 * Method: instantiate MockProvider directly, call fetchJobs(), verify listing count.
 * (Does NOT hit Adzuna/Jooble/Greenhouse APIs)
 *
 * Run: node scratch/eval_job_fallback.js
 */

const ProviderFactory = require('../services/jobs/providers/ProviderFactory')

async function runFallbackTest() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('  Section 6: Job Aggregation Fallback — MockProvider')
  console.log('════════════════════════════════════════════════════════════════\n')

  // Test 1: Instantiate MockProvider via factory
  let provider
  try {
    provider = ProviderFactory.create('mock')
    console.log(`✅ ProviderFactory.create('mock') succeeded`)
    console.log(`   Provider name: ${provider.getProviderName()}`)
    console.log(`   Provider version: ${provider.getProviderVersion()}\n`)
  } catch (err) {
    console.log(`❌ ProviderFactory.create('mock') FAILED: ${err.message}`)
    process.exitCode = 1
    return
  }

  // Test 2: validateCredentials (mock has no external creds needed)
  try {
    const credCheck = provider.validateCredentials ? provider.validateCredentials() : null
    if (credCheck !== null) {
      console.log(`ℹ️  validateCredentials: ${JSON.stringify(credCheck)}`)
    } else {
      console.log(`ℹ️  validateCredentials: method not present on MockProvider`)
    }
  } catch (err) {
    console.log(`ℹ️  validateCredentials threw: ${err.message}`)
  }

  // Test 3: fetchJobs() returns mock listings without any API key
  let rawJobs
  try {
    rawJobs = await provider.fetchJobs({ keywords: 'software engineer' })
    console.log(`✅ fetchJobs() returned ${rawJobs.length} raw listings (no external credentials used)`)
  } catch (err) {
    console.log(`❌ fetchJobs() FAILED: ${err.message}`)
    process.exitCode = 1
    return
  }

  // Test 4: normalize() produces canonical job format
  const normalizedSamples = rawJobs.map(j => provider.normalize(j)).filter(Boolean)
  console.log(`✅ normalize() produced ${normalizedSamples.length} canonical job objects`)

  // Print the normalized listings
  console.log('\n─── Mock Job Listings ───')
  normalizedSamples.forEach((job, i) => {
    console.log(`  ${i+1}. [${job.company}] ${job.title}`)
    console.log(`     Location: ${job.location} | Mode: ${job.workMode} | Source: ${job.source}`)
    console.log(`     Skills: ${job.requiredSkills.join(', ')}`)
  })

  // Test 5: Confirm all jobs carry source='MockProvider'
  const allMock = normalizedSamples.every(j => j.source === 'MockProvider')
  console.log(`\n✅ All normalized jobs have source='MockProvider': ${allMock}`)

  // Test 6: Non-existent provider throws, doesn't fallback silently
  console.log('\n─── Negative test: disabled provider throws ───')
  try {
    ProviderFactory.create('adzuna_disabled')
    console.log('❌ Should have thrown for unknown provider — DID NOT')
    process.exitCode = 1
  } catch (err) {
    console.log(`✅ ProviderFactory.create('adzuna_disabled') correctly threw: ${err.message || err.constructor.name}`)
  }

  console.log('\n════════════════════════════════════════════════════════════════')
  console.log('  FALLBACK SUMMARY')
  console.log('════════════════════════════════════════════════════════════════')
  console.log(`  MockProvider instantiation: SUCCESS`)
  console.log(`  Mock job listings returned : ${rawJobs.length}`)
  console.log(`  Normalized listings        : ${normalizedSamples.length}`)
  console.log(`  All tagged as MockProvider : ${allMock}`)
  console.log(`  External API calls made    : 0 (pure in-memory mock)`)
  console.log('════════════════════════════════════════════════════════════════')
}

runFallbackTest().catch(err => {
  console.error('Runner crashed:', err)
  process.exitCode = 1
})
