import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Log in to save scores.' }), { status: 401 });
	}
	try {
		const body = (await request.json()) as { quizId?: string; score?: number; total?: number };
		const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
		const score = Number(body.score);
		const total = Number(body.total);
		if (!quizId || quizId.length > 64 || !Number.isFinite(score) || !Number.isFinite(total) || total < 1) {
			return new Response(JSON.stringify({ error: 'Invalid payload.' }), { status: 400 });
		}
		if (score < 0 || score > total) {
			return new Response(JSON.stringify({ error: 'Invalid score.' }), { status: 400 });
		}
		const userId = new ObjectId(locals.user.id);
		const db = await getDb();
		const col = db.collection('quizScores');
		const existing = await col.findOne({ userId, quizId });
		const nextHigh = existing ? Math.max(existing.highCorrect as number, score) : score;
		await col.updateOne(
			{ userId, quizId },
			{
				$set: {
					highCorrect: nextHigh,
					total,
					updatedAt: new Date(),
				},
				$setOnInsert: { userId, quizId, createdAt: new Date() },
			},
			{ upsert: true },
		);
		return new Response(JSON.stringify({ ok: true, highCorrect: nextHigh, total }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Server error';
		return new Response(JSON.stringify({ error: msg }), { status: 500 });
	}
};
