import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../lib/db';

const CATS = new Set(['arvr', 'project', 'general']);

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	try {
		const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
		const db = await getDb();
		let cursor = db.collection('posts').find({}).sort({ createdAt: -1 }).limit(200);
		const posts = await cursor.toArray();
		let list = posts.map((p) => ({
			id: p._id.toString(),
			username: p.username as string,
			title: p.title as string,
			body: p.body as string,
			category: p.category as string,
			createdAt: (p.createdAt as Date).toISOString(),
		}));
		if (q) {
			list = list.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					p.body.toLowerCase().includes(q) ||
					p.username.toLowerCase().includes(q),
			);
		}
		return new Response(JSON.stringify({ posts: list }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Server error';
		return new Response(JSON.stringify({ error: msg }), { status: 500 });
	}
};

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Log in to post.' }), { status: 401 });
	}
	try {
		const body = (await request.json()) as { title?: string; body?: string; category?: string };
		const title = (body.title ?? '').trim();
		const text = (body.body ?? '').trim();
		const category = (body.category ?? 'general').trim();
		if (title.length < 3 || title.length > 200) {
			return new Response(JSON.stringify({ error: 'Title must be 3–200 characters.' }), { status: 400 });
		}
		if (text.length < 1 || text.length > 8000) {
			return new Response(JSON.stringify({ error: 'Post body must be 1–8000 characters.' }), { status: 400 });
		}
		if (!CATS.has(category)) {
			return new Response(JSON.stringify({ error: 'Invalid category.' }), { status: 400 });
		}
		const db = await getDb();
		const ins = await db.collection('posts').insertOne({
			username: locals.user.username,
			userId: new ObjectId(locals.user.id),
			title,
			body: text,
			category,
			createdAt: new Date(),
		});
		return new Response(
			JSON.stringify({
				ok: true,
				post: {
					id: ins.insertedId.toString(),
					username: locals.user.username,
					title,
					body: text,
					category,
					createdAt: new Date().toISOString(),
				},
			}),
			{ status: 201, headers: { 'Content-Type': 'application/json' } },
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Server error';
		return new Response(JSON.stringify({ error: msg }), { status: 500 });
	}
};
