<script lang="ts">
	import { editorEnhance } from '$lib/editor-enhance';
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let pending = $state(false);
	const candidate = $derived(data.candidates?.candidates[0]);
	let connectionError = $state('');
	const submit = editorEnhance(
		(value) => {
			pending = value;
		},
		(value) => {
			connectionError = value;
		}
	);
</script>

{#if connectionError}<p class="error" role="alert">
		{connectionError} <a href="/editor">Refresh</a>
	</p>{/if}
<h1>Review words</h1>
<p>Approve for the queue. Words go live only after saving a schedule.</p>
<form method="GET" class="search">
	<input type="hidden" name="seed" value={data.seed} /><label for="search"
		>Find an unreviewed word</label
	>
	<div class="inline">
		<input
			id="search"
			name="search"
			value={data.search}
			placeholder="Exact word"
			maxlength="80"
		/><button>Search</button>
	</div>
	{#if data.search}<a href={`/editor?seed=${data.seed}`}>Clear search</a>{/if}
</form>
{#if data.error}<p class="error" role="alert">
		{data.error} <a href={`/editor?seed=${data.seed}`}>Retry</a>
	</p>{/if}
{#if form && 'error' in form && form.error}<p class="error" role="alert">{form.error}</p>{/if}
{#if candidate}
	<article class="card">
		<p class="eyebrow">{data.candidates?.total} unreviewed {data.search ? 'match' : 'words'}</p>
		<h2 class="word" lang="mn">{candidate.word}</h2>
		<ul class="meanings" lang="mn">
			{#each candidate.meanings as meaning}<li>
					<span>{meaning.pos}</span>
					{meaning.meaning || 'No definition available.'}
				</li>{/each}
		</ul>
		<form method="POST" action="?/decide" use:enhance={submit}>
			<input type="hidden" name="word" value={candidate.word} /><input
				type="hidden"
				name="revision"
				value={data.candidates?.revision}
			/>
			<div class="actions">
				<button name="decision" value="rejected" disabled={pending}>Reject</button><button
					class="primary"
					name="decision"
					value="approved"
					disabled={pending}>Approve</button
				>
			</div>
		</form>
	</article>
{:else if !data.error}<section class="card">
		<h2>{data.search ? 'No unreviewed match' : 'First pass complete'}</h2>
		<p>
			{data.search
				? 'Try another exact word or clear the search.'
				: 'Every eligible word has been reviewed. Approved and rejected words stay out of this pass.'}
		</p>
		<a href="/editor/queue">Open queue</a>
	</section>{/if}
{#if form && 'undo' in form && form.undo}<form
		class="notice"
		method="POST"
		action="?/undo"
		use:enhance={submit}
	>
		<p role="status">Decision saved.</p>
		<input type="hidden" name="token" value={form.undo} /><button disabled={pending}
			>Undo last decision</button
		>
	</form>{/if}
{#if form && 'undone' in form}<p role="status">Decision undone.</p>{/if}
