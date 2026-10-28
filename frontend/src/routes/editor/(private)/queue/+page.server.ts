import { decisionAction, undoAction } from '$lib/server/editor/actions';
import { loadPrivate } from '$lib/server/editor/client';
import type { QueuePage } from '$lib/editor-types';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => {
	const search = event.url.searchParams.get('search') || '';
	const offset = event.url.searchParams.get('offset') || '0';
	const { result, error } = await loadPrivate<QueuePage>(
		event,
		`/queue?search=${encodeURIComponent(search)}&offset=${encodeURIComponent(offset)}`
	);
	return { queue: result, error, search, offset: Number(offset) || 0 };
};
export const actions: Actions = {
	change: (event) => decisionAction(event, true),
	undo: undoAction
};
