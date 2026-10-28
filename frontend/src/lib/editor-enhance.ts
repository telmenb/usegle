import type { SubmitFunction } from '@sveltejs/kit';

/** Keep form state and show an inline retry when the browser loses its connection. */
export function editorEnhance(
	setPending: (value: boolean) => void,
	setError: (value: string) => void
): SubmitFunction {
	return () => {
		setPending(true);
		setError('');
		return async ({ result, update }) => {
			try {
				if (result.type === 'error')
					setError('Connection interrupted. Refresh to check the result before retrying.');
				else await update();
			} finally {
				setPending(false);
			}
		};
	};
}
