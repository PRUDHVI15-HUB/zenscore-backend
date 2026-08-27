const mongoose = require('mongoose')
const SkillCategory = require('../models/SkillCategory')
const Skill = require('../models/Skill')
const Lesson = require('../models/Lesson')
const UserSkillProgress = require('../models/UserSkillProgress')

/**
 * Service Layer for Admin CMS Skills Operations (Step 7)
 */
class AdminSkillsService {
  /**
   * 1. Get Admin CMS Dashboard Analytics
   */
  static async getAdminAnalytics() {
    const [
      totalCategories,
      totalSkills,
      publishedSkills,
      draftSkills,
      totalLessons,
      totalActiveLearners
    ] = await Promise.all([
      SkillCategory.countDocuments({}),
      Skill.countDocuments({}),
      Skill.countDocuments({ isPublished: true }),
      Skill.countDocuments({ isPublished: false }),
      Lesson.countDocuments({}),
      UserSkillProgress.distinct('user').then(arr => arr.length)
    ])

    const lessons = await Lesson.find({}).select('resources quizPlaceholder exercisePlaceholder').lean()
    const totalResources = lessons.reduce((sum, l) => sum + (l.resources?.length || 0), 0)
    const totalQuizzes = lessons.filter(l => l.quizPlaceholder?.questions?.length > 0).length
    const totalExercises = lessons.filter(l => Boolean(l.exercisePlaceholder?.starterCode)).length

    const publishedPercentage = totalSkills > 0 ? Math.round((publishedSkills / totalSkills) * 100) : 0

    return {
      totalCategories,
      totalSkills,
      publishedSkills,
      draftSkills,
      publishedPercentage,
      totalLessons,
      totalResources,
      totalQuizzes,
      totalExercises,
      totalActiveLearners
    }
  }

  // --- CATEGORY CRUD ---

  static async createCategory(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const count = await SkillCategory.countDocuments({})
    return SkillCategory.create({
      name: data.name,
      slug,
      icon: data.icon || '🌐',
      color: data.color || '#EFF6FF',
      description: data.description || '',
      displayOrder: data.displayOrder || count + 1,
      isPublished: data.isPublished !== undefined ? data.isPublished : true
    })
  }

  static async updateCategory(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Category ID' }
    return SkillCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  }

  static async deleteCategory(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Category ID' }
    await Skill.updateMany({ category: id }, { $unset: { category: '' } })
    return SkillCategory.findByIdAndDelete(id)
  }

  static async toggleCategoryPublish(id) {
    const cat = await SkillCategory.findById(id)
    if (!cat) throw { status: 404, message: 'Category not found' }
    cat.isPublished = !cat.isPublished
    await cat.save()
    return cat
  }

  // --- SKILL CRUD ---

  static async createSkill(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return Skill.create({
      name: data.name,
      slug,
      category: data.categoryId,
      difficulty: data.difficulty || 'Intermediate',
      estimatedHours: data.estimatedHours || 12,
      description: data.description || '',
      tags: data.tags || [],
      thumbnail: data.thumbnail || '',
      isPublished: data.isPublished !== undefined ? data.isPublished : true
    })
  }

  static async updateSkill(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Skill ID' }
    return Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  }

  static async deleteSkill(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Skill ID' }
    await Lesson.deleteMany({ skill: id })
    await UserSkillProgress.deleteMany({ skill: id })
    return Skill.findByIdAndDelete(id)
  }

  static async toggleSkillPublish(id) {
    const skill = await Skill.findById(id)
    if (!skill) throw { status: 404, message: 'Skill not found' }
    skill.isPublished = !skill.isPublished
    await skill.save()
    return skill
  }

  // --- LESSON CRUD ---

  static async createLesson(data) {
    if (!mongoose.Types.ObjectId.isValid(data.skillId)) throw { status: 400, message: 'Invalid Skill ID' }
    const count = await Lesson.countDocuments({ skill: data.skillId })
    return Lesson.create({
      skill: data.skillId,
      title: data.title,
      lessonNumber: data.lessonNumber || count + 1,
      estimatedMinutes: data.estimatedMinutes || 30,
      description: data.description || '',
      introduction: data.introduction || data.description || '',
      whatYouWillLearn: data.whatYouWillLearn || [],
      coreConcepts: data.coreConcepts || [],
      syntax: data.syntax || '',
      codeExamples: data.codeExamples || [],
      commonMistakes: data.commonMistakes || [],
      bestPractices: data.bestPractices || [],
      summary: data.summary || '',
      learningObjectives: data.learningObjectives || [],
      resources: data.resources || [],
      exercisePlaceholder: data.exercisePlaceholder || null,
      quizPlaceholder: data.quizPlaceholder || null
    })
  }

  static async updateLesson(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Lesson ID' }
    return Lesson.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  }

  static async deleteLesson(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid Lesson ID' }
    return Lesson.findByIdAndDelete(id)
  }
}

module.exports = AdminSkillsService
