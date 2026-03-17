import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cache

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Please define MONGODB_URI in environment variables')

  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false })
  }

  cache.conn = await cache.promise
  return cache.conn
}
