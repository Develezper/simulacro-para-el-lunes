import { env } from '../../config/env.js';
import { getCollection } from '../../config/mongodb.js';

async function findClientHistoryByEmail(email) {
  const collection = await getCollection(env.mongoClientHistoriesCollection);
  return collection.findOne({ clientEmail: email }, { projection: { _id: 0 } });
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function dedupeTransactionsByCode(transactions) {
  const uniqueByCode = new Map();

  for (const transaction of transactions) {
    if (!transaction?.txnCode) continue;
    uniqueByCode.set(transaction.txnCode, transaction);
  }

  return [...uniqueByCode.values()];
}

function buildHistoryUpdatePipeline({ clientEmail, clientName, transactions }) {
  const uniqueTransactions = dedupeTransactionsByCode(transactions);
  const txnCodes = uniqueTransactions.map((transaction) => transaction.txnCode);
  const now = new Date();

  return [
    {
      $set: {
        clientEmail: { $ifNull: ['$clientEmail', clientEmail] },
        clientName,
        createdAt: { $ifNull: ['$createdAt', now] },
        updatedAt: now,
        transactions: {
          $let: {
            vars: {
              existingTransactions: { $ifNull: ['$transactions', []] }
            },
            in: {
              $concatArrays: [
                {
                  $filter: {
                    input: '$$existingTransactions',
                    as: 'txn',
                    cond: {
                      $not: { $in: ['$$txn.txnCode', txnCodes] }
                    }
                  }
                },
                uniqueTransactions
              ]
            }
          }
        }
      }
    }
  ];
}

async function bulkUpsertClientHistories(histories, options = {}) {
  if (!histories?.length) return;

  const collection = await getCollection(env.mongoClientHistoriesCollection);
  const batchSize = Math.max(1, Number(options.batchSize) || 200);
  const operations = histories
    .filter((history) => history?.clientEmail)
    .map((history) => ({
      updateOne: {
        filter: { clientEmail: history.clientEmail },
        update: buildHistoryUpdatePipeline(history),
        upsert: true
      }
    }));

  if (!operations.length) return;

  const batches = chunkArray(operations, batchSize);

  for (const batch of batches) {
    await collection.bulkWrite(batch, { ordered: false });
  }
}

async function upsertClientHistoryTransaction({ clientEmail, clientName, transaction }) {
  await bulkUpsertClientHistories([
    {
      clientEmail,
      clientName,
      transactions: [transaction]
    }
  ]);
}

export { bulkUpsertClientHistories, findClientHistoryByEmail, upsertClientHistoryTransaction };
