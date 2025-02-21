import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return await fetch('http://localhost:3000/api/game/init').then((res) => res.json())
};
