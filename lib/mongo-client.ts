import { MongoClient } from "mongodb"

export const DB_NAME = "rainfall-data"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// One client per server instance instead of one per request.
export function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set")
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect().catch((e) => {
      global._mongoClientPromise = undefined
      throw e
    })
  }
  return global._mongoClientPromise.then((c) => c.db(DB_NAME))
}
