<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	let { data, children } = $props();
	let localReset = $state('');
	onMount(() => {
		localReset = new Intl.DateTimeFormat(undefined, {
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		}).format(new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`));
	});
	const links = [
		{ href: '/editor', label: 'Review' },
		{ href: '/editor/queue', label: 'Queue' },
		{ href: '/editor/schedule', label: 'Schedule' }
	];
</script>

<header>
	<a href="/editor" class="brand">Usegle <span>word editor</span></a>
	<form method="POST" action="/editor/logout"><button class="quiet">Sign out</button></form>
</header>
{#if data.summary}
	<aside
		class:warning={data.summary.lowInventory || !data.summary.todayScheduled}
		class="coverage"
		aria-label="Schedule coverage"
	>
		<strong>{data.summary.futureScheduledDays} consecutive future days ready</strong>
		<p>{data.summary.queueCount} words queued · First gap: {data.summary.firstMissingDate}</p>
		{#if !data.summary.todayScheduled}<p role="alert">
				Today’s answer is missing. The public game is unavailable; contact the operator for
				recovery.
			</p>{/if}
	</aside>
{:else}<p class="error" role="alert">
		{data.summaryError} <a href={page.url.pathname}>Retry</a>
	</p>{/if}
<main>{@render children()}</main>
<footer>
	<p>Game dates use UTC. Daily reset: 00:00 UTC{localReset ? ` (${localReset} locally)` : ''}.</p>
</footer>
<nav aria-label="Editor sections">
	{#each links as link}<a
			href={link.href}
			aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a
		>{/each}
</nav>
