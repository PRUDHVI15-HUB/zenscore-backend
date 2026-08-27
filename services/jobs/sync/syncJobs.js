const ProviderFactory = require('../providers/ProviderFactory')
const normalizeJob = require('../normalization/normalizeJob')
const validateNormalizedJob = require('../normalization/validateNormalizedJob')
const createSyncResult = require('./syncResult')
const providerLogger = require('../utils/providerLogger')
const JobListing = require('../../../models/JobListing')

/**
 * Orchestrates the full provider sync pipeline: Fetching -> Normalization -> Validation -> Persistence.
 * 
 * @param {string} providerName - Registered provider key (e.g. 'adzuna', 'mock')
 * @param {Object} [options] - Sync execution options
 * @param {boolean} [options.persistToDb=false] - Whether to save/update MongoDB
 * @returns {Promise<Object>} Formatted sync result
 */
const syncJobsFromProvider = async (providerName, options = {}) => {
  const startTime = Date.now()
  const cleanName = (providerName || 'mock').toLowerCase().trim()
  const persistToDb = !!options.persistToDb

  providerLogger.info(cleanName, 'SYNC', `Starting job sync pipeline for provider '${cleanName}' (persistToDb: ${persistToDb})...`)

  try {
    // 1. Load & instantiate provider via Factory
    const providerInstance = ProviderFactory.create(cleanName)

    // 2. Fetch raw jobs
    const rawJobs = await providerInstance.fetchJobs(options)
    const totalFetched = Array.isArray(rawJobs) ? rawJobs.length : 0

    providerLogger.info(cleanName, 'SYNC', `Fetched ${totalFetched} raw records. Proceeding to normalization & validation...`)

    const validJobs = []
    const invalidRecords = []

    // 3. Normalize & Validate each job
    if (Array.isArray(rawJobs)) {
      for (const rawJob of rawJobs) {
        const normalized = normalizeJob(rawJob, providerInstance)

        if (!normalized) {
          invalidRecords.push({ raw: rawJob, errors: ['Normalization produced null object'] })
          continue
        }

        const validation = validateNormalizedJob(normalized)

        if (validation.valid) {
          validJobs.push(normalized)
        } else {
          invalidRecords.push({ job: normalized, errors: validation.errors })
        }
      }
    }

    let inserted = 0
    let updated = 0
    let skipped = 0

    // 4. MongoDB Ingestion & Duplicate Resolution (if persistToDb = true)
    if (persistToDb && validJobs.length > 0) {
      providerLogger.info(cleanName, 'SYNC', `Persisting ${validJobs.length} valid jobs to MongoDB with duplicate detection...`)

      for (const job of validJobs) {
        try {
          // Duplicate detection rule 1: Match source + externalId
          let existingJob = null
          if (job.source && job.externalId) {
            existingJob = await JobListing.findOne({ source: job.source, externalId: job.externalId }).lean()
          }

          // Duplicate detection rule 2 (Fallback): Match title + company + location
          if (!existingJob && job.title && job.company) {
            existingJob = await JobListing.findOne({
              title: job.title,
              company: job.company,
              location: job.location
            }).lean()
          }

          if (existingJob) {
            // Update existing job listing document
            await JobListing.updateOne(
              { _id: existingJob._id },
              {
                $set: {
                  salary: job.salary || existingJob.salary,
                  minSalaryVal: job.minSalaryVal || existingJob.minSalaryVal,
                  deadline: job.deadline || existingJob.deadline,
                  description: job.description || existingJob.description,
                  applyLink: job.applyLink || existingJob.applyLink,
                  postedDate: job.postedDate || existingJob.postedDate,
                  latest: true,
                  source: job.source || existingJob.source,
                  externalId: job.externalId || existingJob.externalId
                }
              }
            )
            updated++
          } else {
            // Insert new job listing document
            await JobListing.create(job)
            inserted++
          }
        } catch (itemErr) {
          providerLogger.warn(cleanName, 'SYNC', `Error syncing individual job '${job.title}': ${itemErr.message}`)
          skipped++
        }
      }
    }

    const durationMs = Date.now() - startTime

    providerLogger.success(
      cleanName,
      'SYNC',
      `Sync pipeline completed in ${durationMs}ms: Fetched ${totalFetched}, Valid ${validJobs.length}, Invalid ${invalidRecords.length}, Inserted ${inserted}, Updated ${updated}, Skipped ${skipped}.`
    )

    return {
      provider: cleanName,
      syncedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      totalFetched,
      validJobs: validJobs.length,
      invalidJobs: invalidRecords.length,
      inserted,
      updated,
      skipped,
      duplicatesRemoved: updated,
      duration: `${durationMs}ms`,
      jobs: validJobs,
      invalidRecords
    }
  } catch (err) {
    const durationMs = Date.now() - startTime
    providerLogger.error(cleanName, 'SYNC', `Sync pipeline failed after ${durationMs}ms: ${err.message}`, err)
    throw err
  }
}

module.exports = {
  syncJobsFromProvider
}
