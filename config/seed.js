const fs = require('fs')
const path = require('path')
const Course = require('../models/Course')
const JobListing = require('../models/JobListing')

const COMPANIES = [
  { name: 'Google', logo: '🔵', about: 'Google is a global technology leader focused on improving how people connect with information.' },
  { name: 'Microsoft', logo: '🟦', about: 'Microsoft enables digital transformation for the era of an intelligent cloud and intelligent edge.' },
  { name: 'Amazon', logo: '🟧', about: 'Amazon is a global technology leader spanning e-commerce, cloud computing, online advertising, and digital streaming.' },
  { name: 'Adobe', logo: '🟥', about: 'Adobe is the global leader in digital media and digital marketing solutions.' },
  { name: 'IBM', logo: '🔷', about: 'IBM is a global technology and consulting corporation producing hardware, middleware, and software.' },
  { name: 'TCS', logo: '💎', about: 'Tata Consultancy Services is an IT services, consulting and business solutions organization.' },
  { name: 'Infosys', logo: '💠', about: 'Infosys is a global leader in next-generation digital services and consulting.' },
  { name: 'Accenture', logo: '🟣', about: 'Accenture is a leading global professional services company providing solutions in strategy, consulting, and technology.' },
  { name: 'Capgemini', logo: '♠️', about: 'Capgemini is a global leader in partnering with companies to transform and manage their business through technology.' },
  { name: 'Deloitte', logo: '🟢', about: 'Deloitte provides industry-leading audit, consulting, tax, and advisory services to many of the world’s most admired brands.' },
  { name: 'Wipro', logo: '🟡', about: 'Wipro Limited is a leading technology services and consulting company focused on building innovative solutions.' },
  { name: 'Cognizant', logo: '🔵', about: 'Cognizant helps companies modernize technology, reimagine processes and transform experiences.' }
]

const TITLES = [
  { title: 'Frontend Engineer', category: 'Frontend', skills: ['React', 'TypeScript', 'TailwindCSS', 'Redux', 'HTML5'] },
  { title: 'React Developer', category: 'Frontend', skills: ['React', 'JavaScript', 'CSS3', 'Next.js', 'Jest'] },
  { title: 'UI Software Engineer', category: 'Frontend', skills: ['Vue.js', 'JavaScript', 'Sass', 'Webpack', 'Figma'] },
  { title: 'Backend Developer', category: 'Backend', skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis'] },
  { title: 'Java Systems Engineer', category: 'Backend', skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Hibernate'] },
  { title: 'Python Backend Engineer', category: 'Backend', skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Docker'] },
  { title: 'Full Stack Engineer', category: 'Full Stack', skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'] },
  { title: 'MERN Stack Developer', category: 'Full Stack', skills: ['MongoDB', 'Express', 'React', 'Node.js', 'TailwindCSS'] },
  { title: 'DevOps & Cloud Engineer', category: 'DevOps', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'] },
  { title: 'Cloud Infrastructure Associate', category: 'Cloud', skills: ['Azure', 'Linux', 'Docker', 'Bash', 'Networking'] },
  { title: 'AI & Machine Learning Engineer', category: 'AI/ML', skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Scikit-Learn'] },
  { title: 'Data Engineer', category: 'Data Science', skills: ['Python', 'SQL', 'Spark', 'Snowflake', 'Airflow'] },
  { title: 'Cybersecurity Associate', category: 'Cybersecurity', skills: ['Network Security', 'Linux', 'Python', 'Ethical Hacking', 'SIEM'] }
]

const LOCATIONS = ['Hyderabad', 'Bangalore', 'Pune', 'Chennai', 'Noida', 'Gurgaon', 'Mumbai', 'Remote']
const WORK_MODES = ['Remote', 'Hybrid', 'On-site']
const EMP_TYPES = ['Full Time', 'Internship', 'Contract', 'Part Time']
const EXPERIENCES = ['Fresher', '0–1 Years', '1–3 Years']

const SALARY_TIERS = [
  { text: '₹22 - ₹35 LPA', val: 22 },
  { text: '₹18 - ₹28 LPA', val: 18 },
  { text: '₹14 - ₹22 LPA', val: 14 },
  { text: '₹10 - ₹16 LPA', val: 10 },
  { text: '₹6 - ₹10 LPA', val: 6 },
  { text: '₹45,000/mo', val: 5 },
  { text: '₹35,000/mo', val: 4 }
]

const seedDatabase = async () => {
  try {
    // 1. Seed Courses if needed
    const courseCount = await Course.countDocuments()
    if (courseCount === 0) {
      const curriculumsDir = path.join(__dirname, 'curriculums')
      if (fs.existsSync(curriculumsDir)) {
        const files = fs.readdirSync(curriculumsDir)
        const coursesToInsert = []

        files.forEach(file => {
          if (file.endsWith('.js')) {
            const filePath = path.join(curriculumsDir, file)
            delete require.cache[require.resolve(filePath)]
            const courseData = require(filePath)
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
        }
      }
    }

    // 2. Purge dummy mock jobs & trigger live Adzuna sync
    const { syncJobsFromProvider } = require('../services/jobs/sync/syncJobs')
    console.log('🧹 Purging dummy mock jobs from MongoDB and triggering live Adzuna sync...')
    
    // Remove dummy non-Adzuna jobs from MongoDB
    await JobListing.deleteMany({
      $or: [
        { source: { $exists: false } },
        { source: 'ZenScore' },
        { source: 'MockProvider' }
      ]
    })

    // Execute live Adzuna sync pipeline into MongoDB
    await syncJobsFromProvider('adzuna', { persistToDb: true })
    // 3. Seed SkillCategories and Skills if empty
    const SkillCategory = require('../models/SkillCategory')
    const Skill = require('../models/Skill')
    const categoryCount = await SkillCategory.countDocuments()

    if (categoryCount === 0) {
      const categoriesToSeed = [
        { name: 'Frontend Development', slug: 'frontend-development', icon: 'layout', color: '#3B82F6', description: 'Master modern web user interfaces, React, TypeScript, and responsive design.', displayOrder: 1, isPublished: true },
        { name: 'Backend Engineering', slug: 'backend-engineering', icon: 'server', color: '#10B981', description: 'Architect high-throughput microservices, RESTful APIs, and scalable databases.', displayOrder: 2, isPublished: true },
        { name: 'Full Stack Web', slug: 'full-stack-web', icon: 'layers', color: '#8B5CF6', description: 'Build end-to-end full stack web applications with modern JS/TS frameworks.', displayOrder: 3, isPublished: true },
        { name: 'Cloud & DevOps', slug: 'cloud-devops', icon: 'cloud', color: '#F59E0B', description: 'Deploy, containerize, and orchestrate cloud-native infrastructures with Docker & AWS.', displayOrder: 4, isPublished: true },
        { name: 'AI & Data Science', slug: 'ai-data-science', icon: 'brain', color: '#EC4899', description: 'Harness Python, Machine Learning, LLMs, and data engineering pipelines.', displayOrder: 5, isPublished: true }
      ]

      const insertedCats = await SkillCategory.insertMany(categoriesToSeed)
      console.log(`✅ Seeded ${insertedCats.length} Skill Categories!`)

      const catMap = new Map(insertedCats.map(c => [c.slug, c._id]))

      const skillsToSeed = [
        { name: 'React.js & Next.js Ecosystem', slug: 'react-nextjs-ecosystem', category: catMap.get('frontend-development'), difficulty: 'Intermediate', estimatedHours: 24, description: 'Master component-driven architecture, state management, hooks, and SSR with Next.js.', tags: ['React', 'Next.js', 'Frontend', 'Web Dev'], isPublished: true },
        { name: 'TypeScript for Scalable Apps', slug: 'typescript-scalable-apps', category: catMap.get('frontend-development'), difficulty: 'Intermediate', estimatedHours: 16, description: 'Write type-safe, maintainable JavaScript code using interfaces, generics, and strict mode.', tags: ['TypeScript', 'JavaScript', 'Frontend'], isPublished: true },
        { name: 'Node.js & Express Microservices', slug: 'nodejs-express-microservices', category: catMap.get('backend-engineering'), difficulty: 'Intermediate', estimatedHours: 28, description: 'Architect asynchronous event-driven REST APIs, JWT authentication, and middleware pipelines.', tags: ['Node.js', 'Express', 'Backend', 'APIs'], isPublished: true },
        { name: 'MongoDB & Database Architecture', slug: 'mongodb-database-architecture', category: catMap.get('backend-engineering'), difficulty: 'Beginner', estimatedHours: 18, description: 'Design NoSQL schemas, indexing strategies, aggregation pipelines, and transaction models.', tags: ['MongoDB', 'NoSQL', 'Database'], isPublished: true },
        { name: 'Full Stack MERN Architecture', slug: 'full-stack-mern-architecture', category: catMap.get('full-stack-web'), difficulty: 'Advanced', estimatedHours: 40, description: 'Engineer end-to-end full stack web applications connecting React frontends with Node/Express APIs.', tags: ['Full Stack', 'MERN', 'React', 'Node.js'], isPublished: true },
        { name: 'Docker & Containerization', slug: 'docker-containerization', category: catMap.get('cloud-devops'), difficulty: 'Intermediate', estimatedHours: 20, description: 'Containerize web services, compose multi-container stacks, and streamline CI/CD deployments.', tags: ['Docker', 'DevOps', 'Containers', 'Cloud'], isPublished: true },
        { name: 'Python & AI Engineering', slug: 'python-ai-engineering', category: catMap.get('ai-data-science'), difficulty: 'Intermediate', estimatedHours: 32, description: 'Build AI applications, prompt engineering pipelines, and machine learning models with Python.', tags: ['Python', 'AI', 'Machine Learning'], isPublished: true }
      ]

      await Skill.insertMany(skillsToSeed)
      console.log(`✅ Seeded ${skillsToSeed.length} Engineering Skills into MongoDB!`)
    }
  } catch (error) {
    console.error('❌ Error in seedDatabase:', error)
  }
}

module.exports = seedDatabase
