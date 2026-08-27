const fs = require('fs')
const path = require('path')

/**
 * Topic-specific YouTube Video ID mapping for all ZenScore Specialization Curriculums
 */
const curriculumVideoMap = {
  'ai-architecture.js': ['aircAruvnKk', 'ad79nYk2keg', 'JMUxmLyrhSk', 'mJeNghZXtMo', 'aircAruvnKk', 'ad79nYk2keg', 'JMUxmLyrhSk', 'mJeNghZXtMo'],
  'machine-learning-core.js': ['i_LwzRVP7bg', 'Gv9_4yMHFhI', '7eh4d6sabA0', 'i_LwzRVP7bg', 'Gv9_4yMHFhI', '7eh4d6sabA0'],
  'prompt-engineering.js': ['_ZvnD73u40o', 'mJeNghZXtMo', 'T9aRN5JkmL8', '_ZvnD73u40o', 'mJeNghZXtMo'],
  'data-structures.js': ['8hly31xKLI0', 'RBSGKlAvoiM', '0IAPZzGSbME', 'Hgr44yE68_Q', '8hly31xKLI0', 'RBSGKlAvoiM', '0IAPZzGSbME', 'Hgr44yE68_Q'],
  'algorithms-analysis.js': ['0IAPZzGSbME', 'Hgr44yE68_Q', '8hly31xKLI0', 'RBSGKlAvoiM', '0IAPZzGSbME'],
  'python-scripting.js': ['rfscVS0vtbw', 'LHBE6Q9XlzI', 'vmEHCJofslg', 'rfscVS0vtbw', 'LHBE6Q9XlzI'],
  'sql-masterclass.js': ['HXV3zeQKqGY', '7S_tz1z_5bA', 'HXV3zeQKqGY', '7S_tz1z_5bA'],
  'mongodb-developer.js': ['ofme2o29ngU', 'pWbMrx5rVBE', 'ofme2o29ngU', 'pWbMrx5rVBE'],
  'docker-guide.js': ['pTFZFxd4hOI', 'fqMOX6JJhGo', 'pTFZFxd4hOI', 'fqMOX6JJhGo'],
  'kubernetes-mastery.js': ['X48VuDVv0do', 'VnvRFRk_52I', 'X48VuDVv0do', 'VnvRFRk_52I'],
  'devops-pipelines.js': ['hQcFE0RD0cQ', '7Qd0VpT_3_8', 'hQcFE0RD0cQ', '7Qd0VpT_3_8'],
  'aws-cloud-practitioner.js': ['3hLmDS179YE', 'SOTamWNgDKc', '3hLmDS179YE', 'SOTamWNgDKc'],
  'azure-fundamentals.js': ['NKEFWyqJ5XA', '10PfU3m9VfA', 'NKEFWyqJ5XA', '10PfU3m9VfA'],
  'cybersecurity-essentials.js': ['inWWhr5tnEA', '3Kq1MIfTWCE', 'inWWhr5tnEA', '3Kq1MIfTWCE'],
  'git-fundamentals.js': ['RGOj5yH7evE', 'DVRQoVR0rmU', 'RGOj5yH7evE', 'DVRQoVR0rmU'],
  'github-collaboration.js': ['DVRQoVR0rmU', 'RGOj5yH7evE', 'DVRQoVR0rmU'],
  'system-design-mastery.js': ['xpDnVSmNfx0', 'SqcXvc3ZmRU', 'xpDnVSmNfx0', 'SqcXvc3ZmRU'],
  'java-masterclass.js': ['eIrMbAQSU34', 'A74TOX803D0', 'eIrMbAQSU34', 'A74TOX803D0'],
  'linux-bash.js': ['wBp0Rb-ZJak', 'ZtqB5MRGJ5E', 'wBp0Rb-ZJak', 'ZtqB5MRGJ5E'],
  'nodejs-api-dev.js': ['fBNz5xF-gIY', 'Oe421EPjeBE', 'fBNz5xF-gIY', 'Oe421EPjeBE'],
  'react-frontend.js': ['bMknfKXIFA8', 'SqcY0GlETPk', 'bMknfKXIFA8', 'SqcY0GlETPk']
}

const curriculumsDir = path.join(__dirname, '..', 'config', 'curriculums')

function fixCurriculums() {
  console.log('🔄 Fixing curriculum YouTube video IDs...')
  const files = fs.readdirSync(curriculumsDir)

  files.forEach(file => {
    if (!file.endsWith('.js')) return
    const filePath = path.join(curriculumsDir, file)
    let content = fs.readFileSync(filePath, 'utf8')

    const videoList = curriculumVideoMap[file] || ['Ke90Tje7VS0', 'aircAruvnKk', 'HXV3zeQKqGY', 'rfscVS0vtbw']
    let videoIdx = 0

    // Replace occurrences of Ke90Tje7VS0 with distinct video IDs per module
    content = content.replace(/"youtubeId":\s*"Ke90Tje7VS0"/g, () => {
      const vid = videoList[videoIdx % videoList.length]
      videoIdx++
      return `"youtubeId": "${vid}"`
    })

    // Also replace thumbnail URLs
    videoIdx = 0
    content = content.replace(/https:\/\/img\.youtube\.com\/vi\/Ke90Tje7VS0\/0\.jpg/g, () => {
      const vid = videoList[videoIdx % videoList.length]
      videoIdx++
      return `https://img.youtube.com/vi/${vid}/0.jpg`
    })

    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  ✓ Updated ${file} with authentic YouTube video IDs.`)
  })

  console.log('✅ All curriculum video IDs updated successfully!')
}

fixCurriculums()
