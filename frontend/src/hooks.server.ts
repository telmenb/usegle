import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const editor = event.url.pathname === '/editor' || event.url.pathname.startsWith('/editor/');
	if (
		editor &&
		!['GET', 'HEAD'].includes(event.request.method) &&
		event.request.headers.get('origin') !== event.url.origin
	) {
		return new Response('Untrusted editor origin.', {
			status: 403,
			headers: { 'Cache-Control': 'no-store' }
		});
	}
	const response = await resolve(event);
	if (editor) {
		response.headers.set('Cache-Control', 'no-store');
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
		response.headers.set('Referrer-Policy', 'same-origin');
	}
	return response;
};
