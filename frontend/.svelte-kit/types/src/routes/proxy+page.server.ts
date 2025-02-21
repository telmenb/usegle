// @ts-nocheck
import type { PageLoad } from './$types';

export const load = async () => {
	return await fetch('http://localhost:3000/api/init').then((res) => res.json())
};
;null as any as PageLoad;