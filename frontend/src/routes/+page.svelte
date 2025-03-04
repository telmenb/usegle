<script lang="ts">
	import App from './App.svelte';
	let { data, form } = $props();
</script>

<App {data} {form} />
