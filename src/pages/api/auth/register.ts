import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../lib/db';
import { createSession, sessionCookieHeader } from '../../../lib/session';
import { normalizeUsername, validatePassword, validateUsername } from '../../../lib/validate';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { username?: string; password?: string };
		const usernameErr = validateUsername(body.username ?? '');
		if (usernameErr) {
			return new Response(JSON.stringify({ error: usernameErr }), { status: 400 });
		}
		const passErr = validatePassword(body.password ?? '');
		if (passErr) {
			return new Response(JSON.stringify({ error: passErr }), { status: 400 });
		}
		const username = normalizeUsername(body.username!);
		const db = await getDb();
		const existing = await db.collection('users').findOne({ username });
		if (existing) {
			return new Response(JSON.stringify({ error: 'That username is already taken.' }), { status: 409 });
		}
		const passwordHash = await bcrypt.hash(body.password!, 10);
		const ins = await db.collection('users').insertOne({
			username,
			passwordHash,
			createdAt: new Date(),
		});
		const token = await createSession(ins.insertedId);
		return new Response(JSON.stringify({ ok: true, username }), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': sessionCookieHeader(token, 60 * 60 * 24 * 7),
			},
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Server error';
		return new Response(JSON.stringify({ error: msg }), { status: 500 });
	}
};
