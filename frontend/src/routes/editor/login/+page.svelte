<script lang="ts">
	import { editorEnhance } from '$lib/editor-enhance';
	import { enhance } from '$app/forms';
	let { form } = $props();
	let pending = $state(false);
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

<section class="login card">
	<h1>Word editor</h1>
	<p>Sign in to review words and prepare future games.</p>
	<form method="POST" use:enhance={submit}>
		<label for="password">Owner password</label><input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			required
			maxlength="1024"
		/>
		{#if connectionError}<p class="error" role="alert">{connectionError}</p>{/if}
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<button class="primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
	</form>
</section>
