import { env } from '../../config/env.js';
import { getCollection } from '../../config/mongodb.js';

async function findClientHistoryByEmail(email) {
  const collection = await getCollection(env.mongoClientHistoriesCollection);
  return collection.findOne({ clientEmail: email }, { projection: { _id: 0 } });
}

async function upsertClientHistoryTransaction({ clientEmail, clientName, transaction }) {
  const collection = await getCollection(env.mongoClientHistoriesCollection);

  await collection.updateOne(
    { clientEmail },
    {
      $set: {
        clientName,
        updatedAt: new Date()
      },
      $setOnInsert: {
        clientEmail,
        createdAt: new Date()
      },
      $pull: {
        transactions: {
          txnCode: transaction.txnCode
        }
      }
    },
    { upsert: true }
  );

  await collection.updateOne(
    { clientEmail },
    {
      $push: {
        transactions: transaction
      }
    }
  );
}

export { findClientHistoryByEmail, upsertClientHistoryTransaction };
