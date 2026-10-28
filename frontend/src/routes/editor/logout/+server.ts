import { admin, BackendError, COOKIE } from '$lib/server/editor/client';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	try {
		await admin(event, '/session/logout', {});
	} catch (err) {
		if (!(err instanceof BackendError) || err.status !== 401)
			return new Response('Sign out failed. Go back and retry.', { status: 503 });
	}
	event.cookies.delete(COOKIE, { path: '/' });
	redirect(303, '/editor/login');
};
