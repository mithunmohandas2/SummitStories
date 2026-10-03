import { MongoClient, type Db } from "mongodb";
import { DatabaseUnavailableError } from "./database-errors";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

function mongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseUnavailableError();
  return uri;
}

export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(mongoUri(), {
      maxPoolSize: 10,
    });
    globalForMongo.mongoClientPromise = client.connect().catch(async () => {
      globalForMongo.mongoClientPromise = undefined;
      await client.close().catch(() => {});
      throw new DatabaseUnavailableError();
    });
  }
  return globalForMongo.mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "summitstories");
}
