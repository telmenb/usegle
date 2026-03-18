import { PUBLIC_USEGLE_API_HOST } from '$env/static/public'

export const load = async () => {
	try {
		const response = await fetch(`${PUBLIC_USEGLE_API_HOST}/api/game/init`, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error('API response not ok:', response.status, response.statusText);
			return { wordLength: -1 } as ApiInitResponse;
		}

		const data = await response.json();
		return data as ApiInitResponse;
	} catch (err) {
		console.error('Failed to load game data:', err);
		return { wordLength: -1 } as ApiInitResponse;
	}
};

interface ApiInitResponse {
	wordLength: number;
}
