import type { RequestEvent } from '@sveltejs/kit';
import { actionFailure, admin } from './client';

export async function decisionAction(event: RequestEvent, queue = false) {
	const form = await event.request.formData();
	try {
		return await admin<{ undo: string }>(
			event,
			queue && form.get('operation') === 'top' ? '/queue/top' : '/decisions',
			{
				word: form.get('word'),
				decision: queue ? 'rejected' : form.get('decision'),
				revision: Number(form.get('revision'))
			}
		);
	} catch (err) {
		return actionFailure(err);
	}
}
export async function undoAction(event: RequestEvent) {
	const form = await event.request.formData();
	try {
		await admin(event, '/undo', { token: form.get('token') });
		return { undone: true };
	} catch (err) {
		return actionFailure(err);
	}
}
