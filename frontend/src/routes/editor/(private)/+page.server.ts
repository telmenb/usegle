import { decisionAction, undoAction } from '$lib/server/editor/actions';
import { loadPrivate } from '$lib/server/editor/client';
import type { CandidatePage } from '$lib/editor-types';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => {
	const suppliedSeed =
		event.url.searchParams.get('seed') || event.cookies.get('editor_review_order') || '';
	const seed = /^[a-zA-Z0-9-]{1,64}$/.test(suppliedSeed) ? suppliedSeed : crypto.randomUUID();
	event.cookies.set('editor_review_order', seed, {
		path: '/editor',
		secure: true,
		httpOnly: true,
		sameSite: 'strict'
	});
	const search = event.url.searchParams.get('search') || '';
	const { result, error } = await loadPrivate<CandidatePage>(
		event,
		`/candidates?seed=${encodeURIComponent(seed)}&search=${encodeURIComponent(search)}`
	);
	return { candidates: result, error, seed, search };
};
export const actions: Actions = {
	decide: (event) => decisionAction(event),
	undo: undoAction
};
