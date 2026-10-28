import { loadPrivate } from '$lib/server/editor/client';
import type { Summary } from '$lib/editor-types';
import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async (event) => {
	const { result, error } = await loadPrivate<Summary>(event, '/summary');
	return { summary: result, summaryError: error };
};
