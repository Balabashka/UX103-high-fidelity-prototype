import { MongoClient, type Db } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB || 'uxplore';

let client: MongoClient | null = null;
let indexesEnsured = false;

export async function getDb(): Promise<Db> {
	if (!uri) {
		throw new Error('MONGODB_URI is not set. Add it to your .env file.');
	}
	if (!client) {
		const nextClient = new MongoClient(uri);
		try {
			await nextClient.connect();
			client = nextClient;
		} catch (error) {
			// Keep cache clean so the next request can retry with a fresh client.
			await nextClient.close().catch(() => {
				/* noop */
			});
			client = null;
			throw error;
		}
	}
	const db = client.db(dbName);
	if (!indexesEnsured) {
		indexesEnsured = true;
		await ensureIndexes(db).catch(() => {
			indexesEnsured = false;
		});
	}
	return db;
}

async function ensureIndexes(db: Db) {
	await db.collection('users').createIndex({ username: 1 }, { unique: true });
	await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
	await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
	await db.collection('quizScores').createIndex({ userId: 1, quizId: 1 }, { unique: true });
	await db.collection('posts').createIndex({ createdAt: -1 });
}
