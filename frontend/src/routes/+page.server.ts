import { PUBLIC_USEGLE_API_HOST } from '$env/static/public'

export const load = async () => {
	const response = await fetch(`${PUBLIC_USEGLE_API_HOST}/api/game/init`)
	return (await response.json()) as ApiInitResponse;
};

interface ApiInitResponse {
	wordLength: number;
}
