import type { APIRoute } from 'astro';
import { clearSessionCookieHeader, deleteSession, parseCookieHeader, SESSION_COOKIE } from '../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const token = parseCookieHeader(request.headers.get('cookie'), SESSION_COOKIE);
	if (token) {
		try {
			await deleteSession(token);
		} catch {
			/* ignore */
		}
	}
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': clearSessionCookieHeader(),
		},
	});
};
