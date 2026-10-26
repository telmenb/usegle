import { admin, BackendError, COOKIE } from '$lib/server/editor/client';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		let session: { token: string; expires: number };
		try {
			session = await admin(event, '/session/login', { password: form.get('password') });
		} catch (err) {
			return fail(err instanceof BackendError ? err.status : 503, {
				error: err instanceof Error ? err.message : 'Sign-in failed. Retry.'
			});
		}
		event.cookies.set(COOKIE, session.token, {
			path: '/',
			secure: true,
			httpOnly: true,
			sameSite: 'strict',
			expires: new Date(session.expires)
		});
		redirect(303, '/editor');
	}
};
