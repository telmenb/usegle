<script lang="ts">
	import './editor.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Usegle word editor</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="Usegle Editor" />
	<link rel="manifest" href="/editor/manifest.json" />
	<link rel="apple-touch-icon" href="/editor/icon.png" />
</svelte:head>
<div class="editor">{@render children()}</div>
