<script lang="ts">
	import { page } from "$app/stores";
	import { LockpickSolver } from "../../../components/lockpick/index.ts";

	const lockId = $page.params.id;

</script>

<LockpickSolver {lockId}></LockpickSolver>