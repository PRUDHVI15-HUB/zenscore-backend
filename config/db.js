require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
})

const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUriEnv = process.env.MONGO_URI
  const username = process.env.MONGO_USERNAME
  const password = process.env.MONGO_PASSWORD
  const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/zenscore'

  let atlasUri = ''
  if (mongoUriEnv && mongoUriEnv.trim().startsWith('mongodb')) {
    atlasUri = mongoUriEnv.trim()
  } else if (username && password) {
    const encodedUsername = encodeURIComponent(username)
    const encodedPassword = encodeURIComponent(password)
    atlasUri =
      `mongodb://${encodedUsername}:${encodedPassword}` +
      `@ac-xhkc71i-shard-00-00.9dyvigf.mongodb.net:27017,` +
      `ac-xhkc71i-shard-00-01.9dyvigf.mongodb.net:27017,` +
      `ac-xhkc71i-shard-00-02.9dyvigf.mongodb.net:27017/zenscore` +
      `?ssl=true` +
      `&replicaSet=atlas-pivdf5-shard-0` +
      `&authSource=admin` +
      `&retryWrites=true` +
      `&w=majority`
  }

  // Handle runtime connection error / disconnection events
  mongoose.connection.on('error', (err) => {
    console.warn('⚠️ Mongoose connection error:', err.message)
  })

  // 1. Direct MongoDB Atlas Connection
  if (atlasUri) {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...')
      const conn = await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 15000,
        family: 4
      })
      console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`)
      return conn
    } catch (error) {
      console.warn(`⚠️ Atlas connection notice: ${error.message}. Retrying...`)
      try {
        const conn = await mongoose.connect(atlasUri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          family: 4
        })
        console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`)
        return conn
      } catch (retryErr) {
        console.error(`❌ MongoDB Atlas Connection Error: ${retryErr.message}`)
      }
    }
  }

  // 2. Fallback to Local MongoDB if Atlas credentials missing or completely blocked
  try {
    console.log('🔄 Connecting to Local MongoDB (127.0.0.1)...')
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      family: 4
    })
    console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}`)
    return conn
  } catch (localErr) {
    console.error('❌ Local MongoDB Connection Failed:', localErr.message)
    return null
  }
}

module.exports = connectDB
