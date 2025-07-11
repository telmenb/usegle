import { PUBLIC_USEGLE_API_HOST } from '$env/static/public'
import { error } from '@sveltejs/kit';

export const load = async () => {
	try {
		const response = await fetch(`${PUBLIC_USEGLE_API_HOST}/api/game/init`, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error('API response not ok:', response.status, response.statusText);
			throw error(500, 'Failed to initialize game');
		}

		const data = await response.json();
		return data as ApiInitResponse;
	} catch (err) {
		console.error('Failed to load game data:', err);
		// Return default values to prevent complete failure
		return { wordLength: 5 } as ApiInitResponse;
	}
};

interface ApiInitResponse {
	wordLength: number;
}
