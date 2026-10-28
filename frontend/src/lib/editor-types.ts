export interface Word {
	word: string;
	meanings: { pos: string; meaning: string }[];
}
export interface Summary {
	today: string;
	todayScheduled: boolean;
	futureScheduledDays: number;
	firstMissingDate: string;
	lowInventory: boolean;
	queueCount: number;
	revision: number;
}
export interface CandidatePage {
	revision: number;
	total: number;
	candidates: Word[];
}
export interface QueuePage {
	revision: number;
	total: number;
	words: Word[];
}
export interface Schedule {
	today: string;
	revision: number;
	rows: { date: string; word: string | null }[];
}
export interface Assignment {
	date: string;
	word: string;
	previous: string | null;
}
export interface Preview {
	today: string;
	revision: number;
	assignments: Assignment[];
	existing: Assignment[];
	shortage: number;
	replacement: boolean;
}
