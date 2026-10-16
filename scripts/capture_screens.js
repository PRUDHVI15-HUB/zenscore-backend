/**
 * Automated Screen Capture Script for Conference Paper Assets
 *
 * Requirements (Task 7):
 * - Playwright Chromium
 * - Viewport: 1440x900
 * - deviceScaleFactor: 2 (High-resolution retina for publication quality)
 * - Authenticated with Demo Account
 * - Crop components:
 *   (a) Dashboard summary cards -> paper_assets/dashboard_summary_cards.png
 *   (b) Academic Snapshot cards (predicted CGPA & required SGPA) -> paper_assets/academic_snapshot_cards.png
 *   (c) Resume Center ATS cards -> paper_assets/resume_center_ats_cards.png
 *   (d) Jobs summary cards -> paper_assets/jobs_summary_cards.png
 */

require('dotenv').config()
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')
const jwt = require('jsonwebtoken')

const BACKEND_PORT = process.env.PORT || 5000
const FRONTEND_PORT = 5173
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`

// Target paper_assets output directories
const ASSET_DIRS = [
  path.join(__dirname, '..', 'paper_assets'),
  path.join(__dirname, '..', '..', 'zenscore-ai', 'paper_assets'),
  path.join(__dirname, '..', '..', 'paper_assets')
]

// Ensure output directories exist
ASSET_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Check if a service is listening on a given port
function checkPort(port) {
  return new Promise(resolve => {
    const path = port === 5000 ? '/api/health' : '/'
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      res.resume()
      resolve(true)
    })
    req.on('error', () => {
      const req2 = http.get(`http://127.0.0.1:${port}${path}`, (res2) => {
        res2.resume()
        resolve(true)
      })
      req2.on('error', () => resolve(false))
      req2.setTimeout(1500, () => {
        req2.destroy()
        resolve(false)
      })
    })
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(false)
    })
  })
}



// Poll until a service becomes ready
async function waitForService(port, name, timeoutMs = 45000) {
  const start = Date.now()
  process.stdout.write(`Waiting for ${name} on port ${port}...`)
  while (Date.now() - start < timeoutMs) {
    const ready = await checkPort(port)
    if (ready) {
      console.log(` Ready! (${((Date.now() - start) / 1000).toFixed(1)}s)`)
      return true
    }
    await new Promise(r => setTimeout(r, 1000))
    process.stdout.write('.')
  }
  console.log(' Timeout!')
  return false
}


// Generate demo token
function getDemoSession() {
  const userId = '6a869cb032ae3175536eac65' // Real student in DB with 5 semesters of transcripts
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'zenscore_secret',
    { expiresIn: '7d' }
  )

  const user = {
    uid: 'lV4BKe8AsPOwyj9wWAo4Hf9r2MD3',
    id: userId,
    _id: userId,
    name: 'PRUDHVI CHINTHAPALLI',
    email: 'prudhvi4739477@gmail.com',
    displayName: 'PRUDHVI CHINTHAPALLI',
    emailVerified: true,
    providerData: [{ providerId: 'password' }],
    isOnboarded: true
  }

  return { token, user }
}

async function saveAsset(sourceLocator, filename) {
  for (const dir of ASSET_DIRS) {
    const targetPath = path.join(dir, filename)
    await sourceLocator.screenshot({
      path: targetPath,
      omitBackground: false
    })
    const stats = fs.statSync(targetPath)
    console.log(`  Saved: ${filename} -> ${targetPath} (${(stats.size / 1024).toFixed(1)} KB)`)
  }
}

async function main() {
  console.log('===============================================================')
  console.log('ZenScore AI — IEEE Conference High-Resolution Screenshot Capture')
  console.log('===============================================================')

  const spawnedProcesses = []

  try {
    // 1. Verify / Launch Backend
    const backendReady = await checkPort(BACKEND_PORT)
    if (!backendReady) {
      console.log('Starting Backend Server (node server.js)...')
      const backendProc = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(BACKEND_PORT) },
        stdio: 'pipe',
        shell: true
      })
      spawnedProcesses.push(backendProc)
      backendProc.stdout.on('data', d => {
        const msg = d.toString()
        if (msg.includes('running') || msg.includes('Connected')) {
          process.stdout.write(`[Backend] ${msg.trim()}\n`)
        }
      })
      backendProc.stderr.on('data', d => process.stderr.write(`[Backend Err] ${d.toString()}`))
      await waitForService(BACKEND_PORT, 'Backend')
    } else {
      console.log(`Backend already active on port ${BACKEND_PORT}.`)
    }

    // 2. Verify / Launch Frontend
    const frontendDir = path.join(__dirname, '..', '..', 'zenscore-ai', 'zenscore-ai')
    const frontendReady = await checkPort(FRONTEND_PORT)
    if (!frontendReady) {
      console.log(`Starting Frontend Vite Server in ${frontendDir}...`)
      const frontendProc = spawn('npm', ['run', 'dev'], {
        cwd: frontendDir,
        env: { ...process.env, PORT: String(FRONTEND_PORT) },
        stdio: 'pipe',
        shell: true
      })
      spawnedProcesses.push(frontendProc)
      frontendProc.stdout.on('data', d => {
        const msg = d.toString()
        if (msg.includes('Local') || msg.includes('ready')) {
          process.stdout.write(`[Frontend] ${msg.trim()}\n`)
        }
      })
      frontendProc.stderr.on('data', d => process.stderr.write(`[Frontend Err] ${d.toString()}`))
      await waitForService(FRONTEND_PORT, 'Frontend Vite')
    } else {
      console.log(`Frontend already active on port ${FRONTEND_PORT}.`)
    }

    // 3. Setup Playwright Browser & Context
    console.log('\nLaunching Playwright Chromium (1440x900 @ 2x DPR)...')
    const browser = await chromium.launch({
      headless: true
    })

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2, // 2x high-density pixel ratio for paper figures
      colorScheme: 'light'
    })

    const page = await context.newPage()
    const { token, user } = getDemoSession()

    // Inject demo auth session directly into localStorage before any page navigation
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('zenscore_jwt', token)
      localStorage.setItem('zenscore_demo_user', JSON.stringify(user))
      localStorage.setItem(`zenscore_onboarding_completed_${user.uid}`, 'true')
      localStorage.setItem(`zenscore_onboarding_completed_${user.email}`, 'true')
      localStorage.setItem(`zenscore_onboarding_completed_${user.id}`, 'true')
      localStorage.setItem('zenscore_selected_career', 'Software Engineer')
      localStorage.setItem('zenscore_career_onboarding_completed', 'true')
    }, { token, user })

    // ── CARD (a): Dashboard Summary Cards ──
    console.log('\n[1/4] Navigating to Dashboard (/dashboard)...')
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('  Page landed at:', page.url())
    await page.waitForSelector('#dashboard-summary-cards', { timeout: 15000 })
    // Ensure animation completes and fonts stabilize
    await page.waitForTimeout(2500)
    const dashboardCards = page.locator('#dashboard-summary-cards')
    await saveAsset(dashboardCards, 'dashboard_summary_cards.png')

    // ── CARD (b): Academic Snapshot Cards with Predicted CGPA and Required SGPA ──
    console.log('\n[2/4] Navigating to Academic Performance Center (/academics)...')
    await page.goto(`${FRONTEND_URL}/academics`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('  Page landed at:', page.url())
    await page.waitForSelector('#academic-snapshot-cards', { timeout: 15000 })
    // Wait for dynamic calculations to render
    await page.waitForTimeout(2500)
    const academicCards = page.locator('#academic-snapshot-cards')
    await saveAsset(academicCards, 'academic_snapshot_cards.png')

    // ── CARD (c): Resume Center ATS Cards ──
    console.log('\n[3/4] Navigating to Career Resume Center (/careers/resume)...')
    await page.goto(`${FRONTEND_URL}/careers/resume`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('  Page landed at:', page.url())
    await page.waitForSelector('#resume-ats-cards', { timeout: 15000 })
    await page.waitForTimeout(2500)
    const resumeCards = page.locator('#resume-ats-cards')
    await saveAsset(resumeCards, 'resume_center_ats_cards.png')

    // ── CARD (d): Jobs Summary Cards ──
    console.log('\n[4/4] Navigating to Jobs & Placements Portal (/jobs)...')
    await page.goto(`${FRONTEND_URL}/jobs`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('  Page landed at:', page.url())
    await page.waitForSelector('#jobs-summary-cards', { timeout: 15000 })
    await page.waitForTimeout(2500)
    const jobsCards = page.locator('#jobs-summary-cards')
    await saveAsset(jobsCards, 'jobs_summary_cards.png')


    console.log('\nAll 4 high-resolution paper assets captured successfully!')
    await browser.close()
  } catch (err) {
    console.error('Screen capture error:', err)
    process.exitCode = 1
  } finally {
    // Terminate spawned background processes
    for (const proc of spawnedProcesses) {
      try {
        console.log(`Cleaning up spawned process PID ${proc.pid}...`)
        process.kill(proc.pid)
      } catch (_) {}
    }
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
