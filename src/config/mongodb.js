import { env } from './env.js';

let mongoDbPromise;

async function getMongoDb() {
  if (!mongoDbPromise) {
    mongoDbPromise = (async () => {
      let mongodb;

      try {
        const mongodbModule = await import('mongodb');
        mongodb = mongodbModule.default ?? mongodbModule;
      } catch (error) {
        if (error?.code === 'ERR_MODULE_NOT_FOUND') {
          const dependencyError = new Error('Dependencia mongodb no instalada. Ejecuta: npm install mongodb');
          dependencyError.statusCode = 500;
          throw dependencyError;
        }

        throw error;
      }

      const client = new mongodb.MongoClient(env.mongoUri);
      await client.connect();

      return client.db(env.mongoDatabase);
    })();
  }

  return mongoDbPromise;
}

async function getCollection(collectionName) {
  const db = await getMongoDb();
  return db.collection(collectionName);
}

export { getCollection, getMongoDb };
