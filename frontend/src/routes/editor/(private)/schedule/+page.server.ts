import { actionFailure, admin, loadPrivate } from '$lib/server/editor/client';
import type { Preview, QueuePage, Schedule } from '$lib/editor-types';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => {
	const from = event.url.searchParams.get('from');
	const [schedule, queue] = await Promise.all([
		loadPrivate<Schedule>(event, `/schedule${from ? `?from=${encodeURIComponent(from)}` : ''}`),
		loadPrivate<QueuePage>(event, '/queue')
	]);
	return { schedule: schedule.result, queue: queue.result, error: schedule.error || queue.error };
};
export const actions: Actions = {
	preview: async (event) => {
		const form = await event.request.formData();
		try {
			return {
				preview: await admin<Preview>(
					event,
					'/schedule/preview',
					form.get('date') ? { date: form.get('date') } : {}
				)
			};
		} catch (err) {
			return actionFailure(err);
		}
	},
	save: async (event) => {
		const form = await event.request.formData();
		try {
			const result = await admin<{ saved: number }>(
				event,
				'/schedule/save',
				JSON.parse(String(form.get('preview')))
			);
			return { saved: result.saved, preview: null };
		} catch (err) {
			return actionFailure(err);
		}
	}
};
