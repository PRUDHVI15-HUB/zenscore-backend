const fs = require('fs')
const path = require('path')
const Course = require('../models/Course')

const seedDatabase = async () => {
  try {
    // Drop existing courses to reload with fresh, unique curriculum structures
    await Course.deleteMany({})
    console.log('🗑️ Dropped existing courses database collection!')

    const curriculumsDir = path.join(__dirname, 'curriculums')
    const files = fs.readdirSync(curriculumsDir)
    const coursesToInsert = []

    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(curriculumsDir, file)
        // Clean cache to allow re-importing updated generations
        delete require.cache[require.resolve(filePath)]
        const courseData = require(filePath)
        
        // Ensure backward-compatible fallback fields are mapped
        if (!courseData.technology && courseData.technologies && courseData.technologies.length > 0) {
          courseData.technology = courseData.technologies[0]
        }
        if (!courseData.duration && courseData.estimatedHours) {
          courseData.duration = courseData.estimatedHours
        }
        if (!courseData.icon) {
          courseData.icon = courseData.thumbnail || 'java'
        }

        coursesToInsert.push(courseData)
      }
    })

    if (coursesToInsert.length > 0) {
      await Course.insertMany(coursesToInsert)
      console.log(`✅ Successfully seeded ${coursesToInsert.length} independent specialization courses dynamically!`)
    } else {
      console.log('⚠️ No curriculum files found to seed.')
    }
  } catch (error) {
    console.error('❌ Error seeding courses database:', error)
  }
}

module.exports = seedDatabase
