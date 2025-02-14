<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div
	class="bg-light-background dark:bg-dark-background notranslate flex h-screen flex-col items-center font-sans dark:text-white"
>
	{@render children()}
</div>
