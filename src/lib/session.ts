import { randomBytes } from 'node:crypto';
import type { ObjectId } from 'mongodb';
import { getDb } from './db';

export const SESSION_COOKIE = 'uxplore_session';
const SESSION_DAYS = 7;

export function parseCookieHeader(header: string | null, name: string): string | null {
	if (!header) return null;
	const parts = header.split(';');
	for (const part of parts) {
		const [k, ...rest] = part.trim().split('=');
		if (k === name) return decodeURIComponent(rest.join('=').trim());
	}
	return null;
}

export async function createSession(userId: ObjectId): Promise<string> {
	const db = await getDb();
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
	await db.collection('sessions').insertOne({ token, userId, expiresAt });
	return token;
}

export async function deleteSession(token: string): Promise<void> {
	const db = await getDb();
	await db.collection('sessions').deleteOne({ token });
}

export async function getUserFromSessionToken(
	token: string | null,
): Promise<{ id: string; username: string } | null> {
	if (!token) return null;
	const db = await getDb();
	const session = await db.collection('sessions').findOne({ token });
	if (!session || session.expiresAt < new Date()) {
		if (session) await db.collection('sessions').deleteOne({ token });
		return null;
	}
	const user = await db.collection('users').findOne({ _id: session.userId });
	if (!user) return null;
	return { id: user._id.toString(), username: user.username as string };
}

export function sessionCookieHeader(token: string, maxAgeSec: number): string {
	const secure = import.meta.env.PROD ? '; Secure' : '';
	return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function clearSessionCookieHeader(): string {
	const secure = import.meta.env.PROD ? '; Secure' : '';
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
