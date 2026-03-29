import type { MiddlewareHandler } from 'astro';
import { getUserFromSessionToken, parseCookieHeader, SESSION_COOKIE } from './lib/session';

export const onRequest: MiddlewareHandler = async (context, next) => {
	context.locals.user = null;
	const token = parseCookieHeader(context.request.headers.get('cookie'), SESSION_COOKIE);
	if (token) {
		try {
			context.locals.user = await getUserFromSessionToken(token);
		} catch {
			context.locals.user = null;
		}
	}
	return next();
};
