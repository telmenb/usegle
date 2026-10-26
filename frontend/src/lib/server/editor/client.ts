import { env } from '$env/dynamic/private';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Preview } from '$lib/editor-types';

export const COOKIE = '__Host-usegle-editor';
export class BackendError extends Error {
	constructor(
		public status: number,
		message: string,
		public preview?: Preview
	) {
		super(message);
	}
}
export async function admin<T>(event: RequestEvent, path: string, body?: unknown): Promise<T> {
	if (!env.USEGLE_API_HOST || !env.ADMIN_API_KEY)
		throw new BackendError(503, 'Editor server settings are missing.');
	let response: Response;
	try {
		response = await event.fetch(`${env.USEGLE_API_HOST}/api/admin${path}`, {
			method: body === undefined ? 'GET' : 'POST',
			headers: {
				Authorization: `Bearer ${env.ADMIN_API_KEY}`,
				'Content-Type': 'application/json',
				Cookie: `${COOKIE}=${event.cookies.get(COOKIE) ?? ''}`,
				Origin: event.url.origin,
				'X-Editor-Client-IP': event.getClientAddress()
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(10000)
		});
	} catch {
		throw new BackendError(503, 'Cannot reach the editor. Retry when your connection returns.');
	}
	let data;
	try {
		data = await response.json();
	} catch {
		throw new BackendError(503, 'Editor returned an unreadable response. Please retry.');
	}
	if (!response.ok)
		throw new BackendError(
			response.status,
			data.errorMessage ?? 'The request failed.',
			data.preview
		);
	return data as T;
}
export function actionFailure(err: unknown) {
	if (err instanceof BackendError) {
		if (err.status === 401) redirect(303, '/editor/login');
		return fail(err.status, {
			error: err.message,
			preview: err.preview ?? null,
			conflict: err.status === 409
		});
	}
	return fail(400, {
		error: 'Invalid request. Refresh and try again.',
		preview: null,
		conflict: false
	});
}
export async function loadPrivate<T>(
	event: RequestEvent,
	path: string
): Promise<{ result: T | null; error: string | null }> {
	try {
		return { result: await admin<T>(event, path), error: null };
	} catch (err) {
		if (err instanceof BackendError && err.status === 401) redirect(303, '/editor/login');
		return {
			result: null,
			error: err instanceof BackendError ? err.message : 'Unable to load. Please retry.'
		};
	}
}
