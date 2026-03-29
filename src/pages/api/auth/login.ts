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
		const user = await db.collection('users').findOne({ username });
		if (!user || !(await bcrypt.compare(body.password!, user.passwordHash as string))) {
			return new Response(JSON.stringify({ error: 'Invalid username or password.' }), { status: 401 });
		}
		const token = await createSession(user._id);
		return new Response(JSON.stringify({ ok: true, username: user.username }), {
			status: 200,
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
