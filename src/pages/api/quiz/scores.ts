import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ scores: [], loggedIn: false }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	try {
		const db = await getDb();
		const rows = await db
			.collection('quizScores')
			.find({ userId: new ObjectId(locals.user.id) })
			.project({ quizId: 1, highCorrect: 1, total: 1 })
			.toArray();
		const scores = rows.map((r) => ({
			quizId: r.quizId as string,
			highCorrect: r.highCorrect as number,
			total: r.total as number,
		}));
		return new Response(JSON.stringify({ scores, loggedIn: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Server error';
		return new Response(JSON.stringify({ error: msg }), { status: 500 });
	}
};
