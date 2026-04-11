<script>
	import { onMount, onDestroy } from 'svelte';
	import { language, translations, initializeData, getItemImageSrc } from '$lib/stores.js';

	let currentLang = 'EN';
	let unsubscribeLanguage;
	unsubscribeLanguage = language.subscribe(value => {
		currentLang = value;
	});
	$: t = translations[currentLang];

	let champions = [];
	let dataReady = false;
	let searchQuery = '';
	let selectedRoles = [];
	let activeSlot = null;
	let selectedChampion = null;
	let selectedSlotInfo = null; // Stores info about where selectedChampion came from
	let bannedChampions = new Set();
	let pickedChampions = new Set();

	let blueBans = [null, null, null, null, null];
	let redBans = [null, null, null, null, null];
	let bluePicks = [null, null, null, null, null];
	let redPicks = [null, null, null, null, null];

	// Drag & Drop state
	let draggedChampion = null;
	let draggedFromSlot = null; // Tracks which slot the champion is dragged from
	let dragOverSlot = null;

	// Debounce for localStorage saves
	let saveDebounceTimer = null;
	const SAVE_DEBOUNCE_MS = 300;

	const roles = [
		{ name: 'Top', id: 'top', icon: '/Top_icon.png' },
		{ name: 'Jungle', id: 'jungle', icon: '/Jungle_icon.png' },
		{ name: 'Mid', id: 'mid', icon: '/Middle_icon.png' },
		{ name: 'ADC', id: 'adc', icon: '/Bottom_icon.png' },
		{ name: 'Support', id: 'support', icon: '/Support_icon.png' }
	];

	$: searchQueryLower = searchQuery.toLowerCase();
	$: filteredChampions = champions.filter((champ) => {
		const notDisabled = !bannedChampions.has(champ.id) && !pickedChampions.has(champ.id);
		if (!notDisabled) return false;

		const matchesSearch = searchQuery.trim() === '' || champ.name.toLowerCase().includes(searchQueryLower);
		if (!matchesSearch) return false;

		const matchesRole = selectedRoles.length === 0 || selectedRoles.some((role) => champ.roles.includes(role));
		return matchesRole;
	});

	function selectRole(roleId, isRightClick = false) {
		if (isRightClick) {
			if (selectedRoles.includes(roleId)) {
				selectedRoles = selectedRoles.filter((r) => r !== roleId);
			} else {
				selectedRoles = [...selectedRoles, roleId];
			}
		} else {
			if (selectedRoles.length === 1 && selectedRoles[0] === roleId) {
				selectedRoles = [];
			} else {
				selectedRoles = [roleId];
			}
		}
	}

	function swapChampions(slot1, slot2, champ1, champ2) {
		// Remove champions from their original positions in the sets
		if (slot1.type === 'ban' && champ1) {
			bannedChampions.delete(champ1.id);
		} else if (slot1.type === 'pick' && champ1) {
			pickedChampions.delete(champ1.id);
		}

		if (slot2.type === 'ban' && champ2) {
			bannedChampions.delete(champ2.id);
		} else if (slot2.type === 'pick' && champ2) {
			pickedChampions.delete(champ2.id);
		}

		// Place champions in their new positions
		if (slot1.type === 'ban') {
			if (slot1.side === 'blue') {
				blueBans[slot1.index] = champ2;
				blueBans = [...blueBans];
			} else {
				redBans[slot1.index] = champ2;
				redBans = [...redBans];
			}
			if (champ2) bannedChampions.add(champ2.id);
		} else if (slot1.type === 'pick') {
			if (slot1.side === 'blue') {
				bluePicks[slot1.index] = champ2;
				bluePicks = [...bluePicks];
			} else {
				redPicks[slot1.index] = champ2;
				redPicks = [...redPicks];
			}
			if (champ2) pickedChampions.add(champ2.id);
		}

		if (slot2.type === 'ban') {
			if (slot2.side === 'blue') {
				blueBans[slot2.index] = champ1;
				blueBans = [...blueBans];
			} else {
				redBans[slot2.index] = champ1;
				redBans = [...redBans];
			}
			if (champ1) bannedChampions.add(champ1.id);
		} else if (slot2.type === 'pick') {
			if (slot2.side === 'blue') {
				bluePicks[slot2.index] = champ1;
				bluePicks = [...bluePicks];
			} else {
				redPicks[slot2.index] = champ1;
				redPicks = [...redPicks];
			}
			if (champ1) pickedChampions.add(champ1.id);
		}

		// Update sets for reactivity
		bannedChampions = new Set(bannedChampions);
		pickedChampions = new Set(pickedChampions);

		saveToLocalStorage();
	}

	function setActiveSlot(type, side, index) {
		// Get the champion in the clicked slot
		let championInSlot = null;
		if (type === 'ban') {
			championInSlot = side === 'blue' ? blueBans[index] : redBans[index];
		} else if (type === 'pick') {
			championInSlot = side === 'blue' ? bluePicks[index] : redPicks[index];
		}

		// If a champion is already selected from another slot, perform swap
		if (selectedChampion && selectedSlotInfo) {
			// Perform the swap
			swapChampions(selectedSlotInfo, { type, side, index }, selectedChampion, championInSlot);
			selectedChampion = null;
			selectedSlotInfo = null;
			activeSlot = null;
		}
		// If a champion is selected from pool (no slot info), place it normally
		else if (selectedChampion && !selectedSlotInfo) {
			activeSlot = { type, side, index };
			selectChampion(selectedChampion);
			selectedChampion = null;
		}
		// If clicking a slot with a champion, select that champion
		else if (championInSlot) {
			selectedChampion = championInSlot;
			selectedSlotInfo = { type, side, index };
			activeSlot = { type, side, index };
		}
		// If clicking an empty slot, just set it as active
		else {
			activeSlot = { type, side, index };
		}
	}

	function selectChampion(champion) {
		// If a champion is selected from a slot, swap with pool champion
		if (selectedChampion && selectedSlotInfo) {
			const { type, side, index } = selectedSlotInfo;

			// Remove old champion from slot's set
			if (type === 'ban') {
				bannedChampions.delete(selectedChampion.id);
				if (side === 'blue') {
					blueBans[index] = champion;
					blueBans = [...blueBans];
				} else {
					redBans[index] = champion;
					redBans = [...redBans];
				}
				bannedChampions.add(champion.id);
			} else if (type === 'pick') {
				pickedChampions.delete(selectedChampion.id);
				if (side === 'blue') {
					bluePicks[index] = champion;
					bluePicks = [...bluePicks];
				} else {
					redPicks[index] = champion;
					redPicks = [...redPicks];
				}
				pickedChampions.add(champion.id);
			}

			bannedChampions = new Set(bannedChampions);
			pickedChampions = new Set(pickedChampions);

			// Clear all selection states
			selectedChampion = null;
			selectedSlotInfo = null;
			activeSlot = null;
			saveToLocalStorage();
			return;
		}

		if (!activeSlot) {
			selectedChampion = champion;
			selectedSlotInfo = null; // Champion is from pool, not from a slot
			return;
		}

		const { type, side, index } = activeSlot;

		// Get current champion in slot (if any) and release it back to pool
		let currentChampion = null;
		if (type === 'ban') {
			currentChampion = side === 'blue' ? blueBans[index] : redBans[index];
			if (currentChampion) {
				bannedChampions.delete(currentChampion.id);
			}
			if (side === 'blue') {
				blueBans[index] = champion;
				blueBans = [...blueBans];
			} else {
				redBans[index] = champion;
				redBans = [...redBans];
			}
			bannedChampions.add(champion.id);
		} else if (type === 'pick') {
			currentChampion = side === 'blue' ? bluePicks[index] : redPicks[index];
			if (currentChampion) {
				pickedChampions.delete(currentChampion.id);
			}
			if (side === 'blue') {
				bluePicks[index] = champion;
				bluePicks = [...bluePicks];
			} else {
				redPicks[index] = champion;
				redPicks = [...redPicks];
			}
			pickedChampions.add(champion.id);
		}

		bannedChampions = new Set(bannedChampions);
		pickedChampions = new Set(pickedChampions);

		// Clear all selection states
		selectedChampion = null;
		selectedSlotInfo = null;
		activeSlot = null;
		saveToLocalStorage();
	}

	function removeFromSlot(type, side, index) {
		let champion;

		if (type === 'ban') {
			if (side === 'blue') {
				champion = blueBans[index];
				blueBans[index] = null;
				blueBans = [...blueBans];
			} else {
				champion = redBans[index];
				redBans[index] = null;
				redBans = [...redBans];
			}
			if (champion) bannedChampions.delete(champion.id);
		} else if (type === 'pick') {
			if (side === 'blue') {
				champion = bluePicks[index];
				bluePicks[index] = null;
				bluePicks = [...bluePicks];
			} else {
				champion = redPicks[index];
				redPicks[index] = null;
				redPicks = [...redPicks];
			}
			if (champion) pickedChampions.delete(champion.id);
		}

		bannedChampions = new Set(bannedChampions);
		pickedChampions = new Set(pickedChampions);

		if (activeSlot?.type === type && activeSlot?.side === side && activeSlot?.index === index) {
			activeSlot = null;
		}

		// Clear selection if the removed champion was selected
		if (selectedSlotInfo?.type === type && selectedSlotInfo?.side === side && selectedSlotInfo?.index === index) {
			selectedChampion = null;
			selectedSlotInfo = null;
		}

		saveToLocalStorage();
	}

	function resetDraft() {
		blueBans = [null, null, null, null, null];
		redBans = [null, null, null, null, null];
		bluePicks = [null, null, null, null, null];
		redPicks = [null, null, null, null, null];
		bannedChampions = new Set();
		pickedChampions = new Set();
		activeSlot = null;
		selectedChampion = null;
		selectedSlotInfo = null;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('drafting-state');
		}
	}

	// Drag & Drop functions
	function handleDragStart(e, champion, fromSlot = null) {
		draggedChampion = champion;
		draggedFromSlot = fromSlot;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', champion.id.toString());
	}

	function handleDragEnd() {
		draggedChampion = null;
		draggedFromSlot = null;
		dragOverSlot = null;
	}

	function handleDragOver(e, type, side, index) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		dragOverSlot = { type, side, index };
	}

	function handleDragLeave() {
		dragOverSlot = null;
	}

	function handleDrop(e, type, side, index) {
		e.preventDefault();
		dragOverSlot = null;

		if (!draggedChampion) return;

		const targetSlot = { type, side, index };

		// If dragged from a slot, perform swap
		if (draggedFromSlot) {
			// Don't do anything if dropping on the same slot
			if (draggedFromSlot.type === type &&
				draggedFromSlot.side === side &&
				draggedFromSlot.index === index) {
				draggedChampion = null;
				draggedFromSlot = null;
				return;
			}

			// Get champion in target slot
			let targetChampion = null;
			if (type === 'ban') {
				targetChampion = side === 'blue' ? blueBans[index] : redBans[index];
			} else if (type === 'pick') {
				targetChampion = side === 'blue' ? bluePicks[index] : redPicks[index];
			}

			// Perform swap using existing swapChampions function
			swapChampions(draggedFromSlot, targetSlot, draggedChampion, targetChampion);

			draggedChampion = null;
			draggedFromSlot = null;
			return;
		}

		// If dragged from pool (no fromSlot), place champion and release existing one
		let currentChampion = null;
		if (type === 'ban') {
			currentChampion = side === 'blue' ? blueBans[index] : redBans[index];
			if (currentChampion) {
				bannedChampions.delete(currentChampion.id);
			}
			if (side === 'blue') {
				blueBans[index] = draggedChampion;
				blueBans = [...blueBans];
			} else {
				redBans[index] = draggedChampion;
				redBans = [...redBans];
			}
			bannedChampions.add(draggedChampion.id);
		} else if (type === 'pick') {
			currentChampion = side === 'blue' ? bluePicks[index] : redPicks[index];
			if (currentChampion) {
				pickedChampions.delete(currentChampion.id);
			}
			if (side === 'blue') {
				bluePicks[index] = draggedChampion;
				bluePicks = [...bluePicks];
			} else {
				redPicks[index] = draggedChampion;
				redPicks = [...redPicks];
			}
			pickedChampions.add(draggedChampion.id);
		}

		bannedChampions = new Set(bannedChampions);
		pickedChampions = new Set(pickedChampions);
		draggedChampion = null;
		draggedFromSlot = null;
		saveToLocalStorage();
	}

	// State for pool drop
	let dragOverPool = false;

	function handlePoolDragOver(e) {
		// Only allow drop if dragged from a slot
		if (draggedFromSlot) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			dragOverPool = true;
		}
	}

	function handlePoolDragLeave() {
		dragOverPool = false;
	}

	function handleDropToPool(e) {
		e.preventDefault();
		dragOverPool = false;

		// Only process if dragged from a slot
		if (!draggedChampion || !draggedFromSlot) {
			draggedChampion = null;
			draggedFromSlot = null;
			return;
		}

		const { type, side, index } = draggedFromSlot;

		// Remove champion from slot
		if (type === 'ban') {
			if (side === 'blue') {
				blueBans[index] = null;
				blueBans = [...blueBans];
			} else {
				redBans[index] = null;
				redBans = [...redBans];
			}
			bannedChampions.delete(draggedChampion.id);
		} else if (type === 'pick') {
			if (side === 'blue') {
				bluePicks[index] = null;
				bluePicks = [...bluePicks];
			} else {
				redPicks[index] = null;
				redPicks = [...redPicks];
			}
			pickedChampions.delete(draggedChampion.id);
		}

		bannedChampions = new Set(bannedChampions);
		pickedChampions = new Set(pickedChampions);
		draggedChampion = null;
		draggedFromSlot = null;
		saveToLocalStorage();
	}

	function saveToLocalStorageImmediate() {
		if (typeof localStorage === 'undefined') return;
		const state = {
			blueBans,
			redBans,
			bluePicks,
			redPicks,
			bannedChampions: Array.from(bannedChampions),
			pickedChampions: Array.from(pickedChampions)
		};
		localStorage.setItem('drafting-state', JSON.stringify(state));
	}

	function saveToLocalStorage() {
		if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
		saveDebounceTimer = setTimeout(() => {
			saveToLocalStorageImmediate();
			saveDebounceTimer = null;
		}, SAVE_DEBOUNCE_MS);
	}

	function loadFromLocalStorage() {
		if (typeof localStorage === 'undefined') return;
		const saved = localStorage.getItem('drafting-state');
		if (saved) {
			const state = JSON.parse(saved);

			// Create lookup map for fresh champion data
			const championsMap = new Map(champions.map(c => [c.id, c]));

			// Helper to refresh champion data
			const refreshChampion = (champ) => {
				if (!champ) return null;
				return championsMap.get(champ.id) || null;
			};

			// Refresh all champion data from fresh source
			blueBans = (state.blueBans || []).map(refreshChampion);
			redBans = (state.redBans || []).map(refreshChampion);
			bluePicks = (state.bluePicks || []).map(refreshChampion);
			redPicks = (state.redPicks || []).map(refreshChampion);

			// Rebuild sets from refreshed data
			bannedChampions = new Set();
			pickedChampions = new Set();

			[...blueBans, ...redBans].forEach(c => {
				if (c) bannedChampions.add(c.id);
			});
			[...bluePicks, ...redPicks].forEach(c => {
				if (c) pickedChampions.add(c.id);
			});
		}
	}

	onMount(async () => {
		const data = await initializeData();
		champions = data.champions;
		dataReady = true;
		loadFromLocalStorage();
	});

	onDestroy(() => {
		// Unsubscribe from language store
		if (unsubscribeLanguage) unsubscribeLanguage();

		// Save pending changes before destroying
		if (saveDebounceTimer) {
			clearTimeout(saveDebounceTimer);
			saveToLocalStorageImmediate();
		}

		// Clear drag state
		draggedChampion = null;
		draggedFromSlot = null;
		dragOverSlot = null;
	});
</script>

<svelte:head>
	<title>LoL Draft Simülatör - Ban Pick Aracı | Albatros</title>
	<meta name="description" content="League of Legends draft simülatörü. Ban ve pick yaparak takım kompozisyonunu planla. Mavi ve kırmızı taraf şampiyon seçimi, rol filtresi ve sürükle-bırak ile stratejik draft pratik et." />
	<meta property="og:title" content="LoL Draft Simülatör - Ban Pick Aracı" />
	<meta property="og:description" content="LoL draft simülatörü ile ban/pick stratejilerini planla. Mavi ve kırmızı takım kompozisyonu oluştur." />
	<meta property="og:url" content="/drafting" />
</svelte:head>

{#if !dataReady}
<div class="skeleton-draft">
	<div class="skeleton-draft-header">
		<div class="skeleton-box" style="width: 80px; height: 32px;"></div>
	</div>
	<div class="skeleton-draft-body">
		<div class="skeleton-draft-side">
			<div class="skeleton-box" style="width: 100%; height: 24px; margin-bottom: 12px;"></div>
			{#each Array(5) as _}
				<div class="skeleton-box" style="width: 100%; height: 56px; margin-bottom: 6px; border-radius: 6px;"></div>
			{/each}
		</div>
		<div class="skeleton-draft-pool">
			{#each Array(30) as _}
				<div class="skeleton-champion"></div>
			{/each}
		</div>
		<div class="skeleton-draft-side">
			<div class="skeleton-box" style="width: 100%; height: 24px; margin-bottom: 12px;"></div>
			{#each Array(5) as _}
				<div class="skeleton-box" style="width: 100%; height: 56px; margin-bottom: 6px; border-radius: 6px;"></div>
			{/each}
		</div>
	</div>
</div>
{:else}
<div class="drafting-page">
	<!-- Top Navbar -->
	<div class="top-navbar">
		<button class="nav-btn" on:click={resetDraft}>
			{t.reset}
		</button>
	</div>

	<!-- Ban Section -->
	<div class="ban-section">
		<div class="team-header blue-header">{t.blueSide}</div>
		<div class="team-header red-header">{t.redSide}</div>
	</div>

	<div class="bans-container">
		<!-- Blue Bans -->
		<div class="ban-slots blue-bans">
			{#each blueBans as ban, i}
				<div
					class="ban-slot"
					class:active={activeSlot?.type === 'ban' &&
						activeSlot?.side === 'blue' &&
						activeSlot?.index === i}
					class:drag-over={dragOverSlot?.type === 'ban' &&
						dragOverSlot?.side === 'blue' &&
						dragOverSlot?.index === i}
					on:click={() => setActiveSlot('ban', 'blue', i)}
					on:contextmenu|preventDefault={() => removeFromSlot('ban', 'blue', i)}
					on:dragover={(e) => handleDragOver(e, 'ban', 'blue', i)}
					on:dragleave={handleDragLeave}
					on:drop={(e) => handleDrop(e, 'ban', 'blue', i)}
					role="button"
					tabindex="0"
				>
					{#if ban}
						<img
							src={getItemImageSrc(ban)}
							alt={ban.name}
							class="banned-champion"
							draggable="true"
							on:dragstart={(e) => handleDragStart(e, ban, { type: 'ban', side: 'blue', index: i })}
							on:dragend={handleDragEnd}
						/>
						<div class="ban-overlay"></div>
					{:else}
						<div class="empty-ban"></div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Red Bans -->
		<div class="ban-slots red-bans">
			{#each redBans as ban, i}
				<div
					class="ban-slot"
					class:active={activeSlot?.type === 'ban' &&
						activeSlot?.side === 'red' &&
						activeSlot?.index === i}
					class:drag-over={dragOverSlot?.type === 'ban' &&
						dragOverSlot?.side === 'red' &&
						dragOverSlot?.index === i}
					on:click={() => setActiveSlot('ban', 'red', i)}
					on:contextmenu|preventDefault={() => removeFromSlot('ban', 'red', i)}
					on:dragover={(e) => handleDragOver(e, 'ban', 'red', i)}
					on:dragleave={handleDragLeave}
					on:drop={(e) => handleDrop(e, 'ban', 'red', i)}
					role="button"
					tabindex="0"
				>
					{#if ban}
						<img
							src={getItemImageSrc(ban)}
							alt={ban.name}
							class="banned-champion"
							draggable="true"
							on:dragstart={(e) => handleDragStart(e, ban, { type: 'ban', side: 'red', index: i })}
							on:dragend={handleDragEnd}
						/>
						<div class="ban-overlay"></div>
					{:else}
						<div class="empty-ban"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Main Draft Container -->
	<div class="draft-container">
		<!-- Blue Side Picks -->
		<div class="team-picks blue-picks">
			{#each bluePicks as pick, i}
				<div class="pick-row" class:gap-after={i === 2}>
					<div class="pick-label blue-label">{t.bluePrefix}{i + 1}</div>
					<div
						class="pick-slot"
						class:active={activeSlot?.type === 'pick' &&
							activeSlot?.side === 'blue' &&
							activeSlot?.index === i}
						class:drag-over={dragOverSlot?.type === 'pick' &&
							dragOverSlot?.side === 'blue' &&
							dragOverSlot?.index === i}
						on:click={() => setActiveSlot('pick', 'blue', i)}
						on:contextmenu|preventDefault={() => removeFromSlot('pick', 'blue', i)}
						on:dragover={(e) => handleDragOver(e, 'pick', 'blue', i)}
						on:dragleave={handleDragLeave}
						on:drop={(e) => handleDrop(e, 'pick', 'blue', i)}
						role="button"
						tabindex="0"
					>
						{#if pick}
							<img
								src={getItemImageSrc(pick)}
								alt={pick.name}
								class="picked-champion"
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, pick, { type: 'pick', side: 'blue', index: i })}
								on:dragend={handleDragEnd}
							/>
						{:else}
							<div class="empty-pick">
								</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Center Column - Champion Pool -->
		<div class="center-column">
			<div class="search-and-filters">
				<div class="role-filters">
					{#each roles as role}
						<button
							class="role-btn"
							class:active={selectedRoles.includes(role.id)}
							on:click={() => selectRole(role.id, false)}
							on:contextmenu|preventDefault={() => selectRole(role.id, true)}
							title={role.name}
						>
							<img src={role.icon} alt={role.name} class="role-icon" />
						</button>
					{/each}
				</div>

				<div class="search-section">
					<input
						type="text"
						class="search-input"
						placeholder={t.searchChampions}
						bind:value={searchQuery}
					/>
				</div>
			</div>

			<div
				class="champion-grid"
				class:drag-over-pool={dragOverPool}
				on:dragover={handlePoolDragOver}
				on:dragleave={handlePoolDragLeave}
				on:drop={handleDropToPool}
			>
				{#each filteredChampions as champion}
					<div
						class="champion-card"
						class:selected={selectedChampion?.id === champion.id}
						class:dragging={draggedChampion?.id === champion.id}
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, champion)}
						on:dragend={handleDragEnd}
						on:click={() => selectChampion(champion)}
						on:contextmenu|preventDefault={() => {
							if (selectedChampion?.id === champion.id) {
								selectedChampion = null;
							}
						}}
						role="button"
						tabindex="0"
					>
						<img src={getItemImageSrc(champion)} alt={champion.name} loading="lazy" />
						<div class="champion-name">{champion.name}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Red Side Picks -->
		<div class="team-picks red-picks">
			{#each redPicks as pick, i}
				<div class="pick-row" class:gap-after={i === 2}>
					<div
						class="pick-slot"
						class:active={activeSlot?.type === 'pick' &&
							activeSlot?.side === 'red' &&
							activeSlot?.index === i}
						class:drag-over={dragOverSlot?.type === 'pick' &&
							dragOverSlot?.side === 'red' &&
							dragOverSlot?.index === i}
						on:click={() => setActiveSlot('pick', 'red', i)}
						on:contextmenu|preventDefault={() => removeFromSlot('pick', 'red', i)}
						on:dragover={(e) => handleDragOver(e, 'pick', 'red', i)}
						on:dragleave={handleDragLeave}
						on:drop={(e) => handleDrop(e, 'pick', 'red', i)}
						role="button"
						tabindex="0"
					>
						{#if pick}
							<img
								src={getItemImageSrc(pick)}
								alt={pick.name}
								class="picked-champion"
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, pick, { type: 'pick', side: 'red', index: i })}
								on:dragend={handleDragEnd}
							/>
						{:else}
							<div class="empty-pick">
								</div>
						{/if}
					</div>
					<div class="pick-label red-label">{t.redPrefix}{i + 1}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
{/if}

<style>
	.skeleton-draft {
		height: 100vh;
		background: #000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.skeleton-draft-header {
		padding: 12px 20px;
		border-bottom: 1px solid #1a1a1a;
	}

	.skeleton-draft-body {
		flex: 1;
		display: flex;
		gap: 12px;
		padding: 16px;
	}

	.skeleton-draft-side {
		width: 200px;
		flex-shrink: 0;
	}

	.skeleton-draft-pool {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-content: flex-start;
		padding: 12px;
		background: #0d0d0d;
		border-radius: 8px;
	}

	.skeleton-draft .skeleton-box {
		background: #1a1a1a;
		border-radius: 4px;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-draft .skeleton-champion {
		width: 52px;
		height: 52px;
		border-radius: 6px;
		background: #1a1a1a;
		flex-shrink: 0;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.8; }
	}

	.drafting-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #0a0a0a;
		background-image: url('/leagueoflegendsmap.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
	}

	.drafting-page::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		z-index: 0;
	}

	.drafting-page > * {
		position: relative;
		z-index: 1;
	}

	/* Top Navbar */
	.top-navbar {
		position: absolute;
		top: 22px;
		right: 5px;
		display: flex;
		gap: 15px;
		z-index: 100;
	}

	.nav-btn {
		background: rgba(20, 20, 20, 0.95);
		border: 1px solid #2a2a2a;
		color: #fff;
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 600;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.nav-btn:hover {
		background-color: #1a1a1a;
		border-color: #3a3a3a;
	}

	.ban-section {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0;
		padding: 20px 0 0 0;
		margin: 0 auto;
		max-width: 1100px;
		width: 100%;
	}

	.team-header {
		flex: 1;
		padding: 12px 20px;
		text-align: center;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 1.5px;
		color: #fff;
	}

	.blue-header {
		background-color: #4169E1;
	}

	.red-header {
		background-color: #E74856;
	}

	.bans-container {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0;
		padding: 0;
		margin: 0 auto 20px auto;
		max-width: 1100px;
		width: 100%;
	}

	.ban-slots {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 12px 20px;
		background-color: rgba(0, 0, 0, 0.4);
	}

	.blue-bans {
		justify-content: flex-start;
		padding-left: 0;
	}

	.blue-bans .ban-slot:nth-child(3) {
		margin-right: 15px;
	}

	.red-bans {
		justify-content: flex-end;
		padding-right: 0;
	}

	.red-bans .ban-slot:nth-child(2) {
		margin-right: 15px;
	}

	.ban-slot {
		width: 95px;
		height: 95px;
		background-color: rgba(0, 0, 0, 0.3);
		border: 2px solid #3a3a3a;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.ban-slot:hover {
		border-color: #4a4a4a;
		transform: scale(1.05);
	}

	.ban-slot.active {
		border-color: #FF1744;
		box-shadow: 0 0 12px rgba(255, 23, 68, 0.5);
	}

	.ban-slot.drag-over {
		border-color: #4CAF50;
		box-shadow: 0 0 15px rgba(76, 175, 80, 0.6);
		background-color: rgba(76, 175, 80, 0.1);
	}

	.banned-champion {
		width: 100%;
		height: 100%;
		object-fit: cover;
		cursor: grab;
	}

	.banned-champion:active {
		cursor: grabbing;
	}

	.ban-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(255, 0, 0, 0.3));
		pointer-events: none;
	}

	.ban-overlay::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(-45deg);
		width: 70%;
		height: 2px;
		background-color: #ff0000;
	}

	.empty-ban {
		width: 100%;
		height: 100%;
		background-color: transparent;
	}

	.draft-container {
		display: flex;
		flex: 1;
		overflow: hidden;
		gap: 27px;
		padding: 22px 27px 27px 27px;
		justify-content: center;
		align-items: flex-start;
	}

	.team-picks {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 176px;
	}

	.pick-row {
		display: flex;
		align-items: center;
		gap: 11px;
	}

	.pick-row.gap-after {
		margin-bottom: 32px;
	}

	.pick-label {
		font-size: 22px;
		font-weight: 700;
		width: 38px;
		text-align: center;
	}

	.blue-label {
		color: #5a8fff;
	}

	.red-label {
		color: #ff6b78;
	}

	.pick-slot {
		width: 115px;
		height: 115px;
		background-color: rgba(0, 0, 0, 0.3);
		border: 2px solid #3a3a3a;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.pick-slot:hover {
		border-color: #4a4a4a;
		transform: scale(1.02);
	}

	.pick-slot.active {
		border-color: #FF1744;
		box-shadow: 0 0 15px rgba(255, 23, 68, 0.6);
	}

	.pick-slot.drag-over {
		border-color: #4CAF50;
		box-shadow: 0 0 18px rgba(76, 175, 80, 0.7);
		background-color: rgba(76, 175, 80, 0.1);
	}

	.picked-champion {
		width: 100%;
		height: 100%;
		object-fit: cover;
		cursor: grab;
	}

	.picked-champion:active {
		cursor: grabbing;
	}

	.empty-pick {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
	}

	.empty-icon {
		font-size: 43px;
		opacity: 0.2;
	}

	.center-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow: hidden;
		max-width: 700px;
		min-height: 0;
	}

	.search-and-filters {
		display: flex;
		align-items: center;
		gap: 20px;
		justify-content: space-between;
	}

	.search-section {
		flex: 1;
		display: flex;
		max-width: 250px;
	}

	.search-input {
		width: 100%;
		padding: 10px 16px;
		background-color: #0d0d0d;
		border: 1px solid #2a2a2a;
		border-radius: 4px;
		color: #fff;
		font-size: 14px;
		transition: all 0.2s;
	}

	.search-input::placeholder {
		color: #666;
	}

	.search-input:focus {
		outline: none;
		border-color: #3a3a3a;
		background-color: #1a1a1a;
	}

	.role-filters {
		display: flex;
		gap: 8px;
		flex-wrap: nowrap;
	}

	.role-btn {
		background-color: #0d0d0d;
		border: 1px solid #2a2a2a;
		padding: 0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		opacity: 0.7;
	}

	.role-btn:hover {
		border-color: #3a3a3a;
		background-color: #1a1a1a;
		opacity: 0.8;
	}

	.role-btn.active {
		border-color: #FF1744;
		background-color: rgba(255, 23, 68, 0.15);
		opacity: 1;
		box-shadow: 0 0 8px rgba(255, 23, 68, 0.3);
	}

	.role-icon {
		width: 32px;
		height: 32px;
		object-fit: contain;
		filter: brightness(1.3);
	}

	.champion-grid {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 6px;
		padding: 12px;
		background-color: rgba(0, 0, 0, 0.4);
		border-radius: 6px;
		border: 1px solid #2a2a2a;
		max-height: calc(100vh - 280px);
		min-height: 0;
		transition: all 0.2s;
	}

	.champion-grid.drag-over-pool {
		border-color: #FF1744;
		box-shadow: inset 0 0 20px rgba(255, 23, 68, 0.3);
		background-color: rgba(255, 23, 68, 0.05);
	}

	.champion-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		transition: all 0.2s;
		padding: 6px;
		border-radius: 6px;
	}

	.champion-card img {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 6px;
		border: 2px solid #2a2a2a;
		transition: all 0.2s;
	}

	.champion-card:hover img {
		transform: scale(1.05);
	}

	.champion-card.selected img {
		border-color: #FF1744;
	}

	.champion-name {
		font-size: 12px;
		text-align: center;
		color: #ccc;
		line-height: 1.2;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
		letter-spacing: 0.2px;
	}

	.champion-card:hover .champion-name {
		color: #fff;
	}

	.champion-card.selected .champion-name {
		color: #FF1744;
		font-weight: 700;
	}

	.champion-card.dragging {
		opacity: 0.5;
		transform: scale(0.95);
	}

	.champion-card {
		cursor: grab;
	}

	.champion-card:active {
		cursor: grabbing;
	}

	.champion-grid::-webkit-scrollbar {
		width: 8px;
	}

	.champion-grid::-webkit-scrollbar-track {
		background: #1a1a1a;
		border-radius: 4px;
	}

	.champion-grid::-webkit-scrollbar-thumb {
		background: #3a3a3a;
		border-radius: 4px;
	}

	.champion-grid::-webkit-scrollbar-thumb:hover {
		background: #4a4a4a;
	}
</style>
