<script>
	import { onMount, onDestroy } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { language, translations, championsStore, itemsStore, initializeData, getItemImageSrc } from '$lib/stores.js';

	let currentLang = 'EN';
	let unsubscribeLanguage;
	unsubscribeLanguage = language.subscribe(value => {
		currentLang = value;
	});
	$: t = translations[currentLang];

	const flipDurationMs = 50;
	let clickTimer = null;
	const DOUBLE_CLICK_DELAY = 250;

	let activeTab = 'champions'; // 'champions' or 'items'

	let tiers = [
		{ id: 'z', name: 'Z', color: '#9b59b6', champions: [], items: [] },
		{ id: 's', name: 'S', color: '#e74c3c', champions: [], items: [] },
		{ id: 'a', name: 'A', color: '#ff8c00', champions: [], items: [] },
		{ id: 'b', name: 'B', color: '#2ecc71', champions: [], items: [] },
		{ id: 'c', name: 'C', color: '#1abc9c', champions: [], items: [] },
		{ id: 'd', name: 'D', color: '#3498db', champions: [], items: [] }
	];

	let championPool = [];
	let itemPool = [];
	let allChampions = [];
	let allItems = [];
	let dataReady = false;
	let searchQuery = '';
	let showEditPanel = false;
	let showHighlighterPanel = false;
	let championHighlights = {};
	let selectedHighlightColor = null;
	let highlighterMode = 'color'; // 'color' or 'erase'
	let showColorPickerForTier = null;
	let tierLabelWidth = 100;
	let customColorHue = 0;
	let isDraggingColor = false;
	let customColors = ['#ffffff']; // Başlangıçta 1 özel renk slotu (beyaz)
	let activeColorSlot = null;
	const maxCustomColors = 8;
	let tierCustomColorHue = 0;
	let isDraggingTierColor = false;
	let saveDebounceTimer = null;
	const SAVE_DEBOUNCE_MS = 300;

	// Drag sırasında auto-scroll için
	let tiersContainerEl = null;
	let autoScrollInterval = null;
	let currentScrollSpeed = 0;
	let lastMouseMoveTime = 0;
	const AUTO_SCROLL_SPEED = 8;
	const EDGE_THRESHOLD = 80; // Kenardan bu kadar piksel yakınlıkta scroll başlar
	const MOUSE_MOVE_THROTTLE = 16; // ~60fps throttle

	function calculateTierLabelWidth() {
		let longestWordLength = 0;
		tiers.forEach(t => {
			const words = t.name.split(' ');
			words.forEach(word => {
				if (word.length > longestWordLength) {
					longestWordLength = word.length;
				}
			});
		});

		const minWidth = 100;
		const charWidth = 18;
		const padding = 20;
		const buffer = 18;
		const neededWidth = longestWordLength * charWidth + padding + buffer;
		tierLabelWidth = Math.min(Math.max(minWidth, neededWidth), 450);
	}

	const highlightColors = [
		'#808080',
		'#3498db',
		'#e74c3c',
		'#2ecc71',
		'#e67e22',
		'#f1c40f',
		'#1abc9c',
		'#9b59b6'
	];

	const tierColorOptions = [
		{ name: 'Purple', value: '#9b59b6' },
		{ name: 'Red', value: '#e74c3c' },
		{ name: 'Pink', value: '#e91e63' },
		{ name: 'Orange', value: '#e67e22' },
		{ name: 'Yellow', value: '#f1c40f' },
		{ name: 'Green', value: '#2ecc71' },
		{ name: 'Teal', value: '#1abc9c' },
		{ name: 'Blue', value: '#3498db' },
		{ name: 'Light Blue', value: '#5dade2' },
		{ name: 'Gray', value: '#95a5a6' }
	];

	// Rol filtreleme için
	const roles = [
		{ name: 'Top', id: 'top', icon: '/Top_icon.png' },
		{ name: 'Jungle', id: 'jungle', icon: '/Jungle_icon.png' },
		{ name: 'Mid', id: 'mid', icon: '/Middle_icon.png' },
		{ name: 'ADC', id: 'adc', icon: '/Bottom_icon.png' },
		{ name: 'Support', id: 'support', icon: '/Support_icon.png' }
	];
	let selectedRoles = [];

	$: currentPool = activeTab === 'champions' ? championPool : itemPool;
	$: searchQueryLower = searchQuery.toLowerCase();
	$: filteredItems = currentPool.filter(item => {
		// Arama filtresi
		const matchesSearch = searchQuery.trim() === '' || item.name.toLowerCase().includes(searchQueryLower);
		if (!matchesSearch) return false;

		// Rol filtresi (sadece champions sekmesinde)
		if (activeTab === 'champions' && selectedRoles.length > 0) {
			const matchesRole = selectedRoles.some(role => item.roles?.includes(role));
			if (!matchesRole) return false;
		}

		return true;
	});

	function selectRole(roleId, isRightClick = false) {
		if (isRightClick) {
			// Sağ tık: çoklu seçim
			if (selectedRoles.includes(roleId)) {
				selectedRoles = selectedRoles.filter(r => r !== roleId);
			} else {
				selectedRoles = [...selectedRoles, roleId];
			}
		} else {
			// Sol tık: tekli seçim
			if (selectedRoles.length === 1 && selectedRoles[0] === roleId) {
				selectedRoles = [];
			} else {
				selectedRoles = [roleId];
			}
		}
	}

	function isDragging() {
		return document.querySelector('[data-is-dnd-shadow-item-hint]') !== null;
	}

	function handleMouseMoveDuringDrag(e) {
		// Throttle: çok sık çağrılmasını engelle
		const now = Date.now();
		if (now - lastMouseMoveTime < MOUSE_MOVE_THROTTLE) return;
		lastMouseMoveTime = now;

		if (!isDragging() || !tiersContainerEl) {
			stopAutoScroll();
			return;
		}

		const containerRect = tiersContainerEl.getBoundingClientRect();
		const mouseY = e.clientY;

		// Üst kenara yakınsa yukarı scroll
		if (mouseY < containerRect.top + EDGE_THRESHOLD) {
			const intensity = 1 - (mouseY - containerRect.top) / EDGE_THRESHOLD;
			currentScrollSpeed = -AUTO_SCROLL_SPEED * Math.max(intensity, 0.3);
			startAutoScroll();
		}
		// Alt kenara yakınsa aşağı scroll
		else if (mouseY > containerRect.bottom - EDGE_THRESHOLD) {
			const intensity = 1 - (containerRect.bottom - mouseY) / EDGE_THRESHOLD;
			currentScrollSpeed = AUTO_SCROLL_SPEED * Math.max(intensity, 0.3);
			startAutoScroll();
		}
		// Ortadaysa scroll durdur
		else {
			stopAutoScroll();
		}
	}

	function startAutoScroll() {
		if (autoScrollInterval) return; // Zaten çalışıyor

		autoScrollInterval = setInterval(() => {
			if (tiersContainerEl && isDragging()) {
				tiersContainerEl.scrollTop += currentScrollSpeed;
			} else {
				stopAutoScroll();
			}
		}, 16); // ~60fps
	}

	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
		currentScrollSpeed = 0;
	}

	function handleTierDrop(tierId, e) {
		const tier = tiers.find(t => t.id === tierId);
		if (!tier) return;

		stopAutoScroll();

		// Ensure arrays exist
		if (!tier.champions) tier.champions = [];
		if (!tier.items) tier.items = [];

		if (activeTab === 'champions') {
			tier.champions = e.detail.items;
		} else {
			tier.items = e.detail.items;
		}
		tiers = [...tiers];
		saveToLocalStorage();
	}

	function handlePoolDrop(e) {
		stopAutoScroll();
		const newItems = e.detail.items;

		if (activeTab === 'champions') {
			// Filtre aktif mi kontrol et (arama VEYA rol filtresi)
			const hasActiveFilter = searchQuery.trim() !== '' || selectedRoles.length > 0;

			if (!hasActiveFilter) {
				// Filtre yoksa direkt güncelle
				championPool = newItems;
			} else {
				// Filtre varsa, filtreye uymayan şampiyonları koru
				const currentFilteredIds = new Set(filteredItems.map(c => c.id));

				// Filtreye uymayan şampiyonlar (korunacak)
				const unfilteredChampions = championPool.filter(c => !currentFilteredIds.has(c.id));

				// Yeni pool = korunanlar + yeni filtrelenmiş öğeler
				championPool = [...unfilteredChampions, ...newItems].sort((a, b) => a.name.localeCompare(b.name));
			}
		} else {
			if (searchQuery.trim() === '') {
				itemPool = newItems;
			} else {
				const currentFilteredIds = new Set(filteredItems.map(i => i.id));

				const unfilteredItems = itemPool.filter(i => !currentFilteredIds.has(i.id));

				itemPool = [...unfilteredItems, ...newItems].sort((a, b) => a.name.localeCompare(b.name));
			}
		}
		saveToLocalStorage();
	}

	function returnToPool(tierId, itemId) {
		const tier = tiers.find(t => t.id === tierId);
		if (!tier) return;

		// Ensure arrays exist
		if (!tier.champions) tier.champions = [];
		if (!tier.items) tier.items = [];

		if (activeTab === 'champions') {
			const champion = tier.champions.find(c => c.id === itemId);
			if (!champion) return;
			tier.champions = tier.champions.filter(c => c.id !== itemId);
			championPool = [...championPool, champion].sort((a, b) => a.name.localeCompare(b.name));
		} else {
			const item = tier.items.find(i => i.id === itemId);
			if (!item) return;
			tier.items = tier.items.filter(i => i.id !== itemId);
			itemPool = [...itemPool, item].sort((a, b) => a.name.localeCompare(b.name));
		}
		tiers = [...tiers];
		saveToLocalStorage();
	}

	function toggleEditPanel() {
		showEditPanel = !showEditPanel;
		if (showEditPanel) showHighlighterPanel = false;
	}

	function toggleHighlighterPanel() {
		showHighlighterPanel = !showHighlighterPanel;
		if (showHighlighterPanel) showEditPanel = false;
	}

	function addTier() {
		const newId = 'tier_' + Date.now();
		tiers = [...tiers, { id: newId, name: 'New', color: '#95a5a6', champions: [], items: [] }];
		calculateTierLabelWidth();
		saveToLocalStorage();
	}

	function deleteTier(tierId) {
		const tier = tiers.find(t => t.id === tierId);
		if (!tier) return;

		if (tier.champions && tier.champions.length > 0) {
			championPool = [...championPool, ...tier.champions].sort((a, b) => a.name.localeCompare(b.name));
		}
		if (tier.items && tier.items.length > 0) {
			itemPool = [...itemPool, ...tier.items].sort((a, b) => a.name.localeCompare(b.name));
		}
		tiers = tiers.filter(t => t.id !== tierId);
		calculateTierLabelWidth();
		saveToLocalStorage();
	}

	function moveTierUp(index) {
		if (index > 0) {
			[tiers[index - 1], tiers[index]] = [tiers[index], tiers[index - 1]];
			tiers = [...tiers];
			saveToLocalStorage();
		}
	}

	function moveTierDown(index) {
		if (index < tiers.length - 1) {
			[tiers[index], tiers[index + 1]] = [tiers[index + 1], tiers[index]];
			tiers = [...tiers];
			saveToLocalStorage();
		}
	}

	function handleTiersDndConsider(e) {
		tiers = e.detail.items;
	}

	function handleTiersDndFinalize(e) {
		tiers = e.detail.items;
		saveToLocalStorage();
	}

	function updateTierColor(tierId, color) {
		const tier = tiers.find(t => t.id === tierId);
		tier.color = color;
		tiers = [...tiers];
		saveToLocalStorage();
	}

	function updateTierName(tierId, name) {
		const tier = tiers.find(t => t.id === tierId);
		tier.name = name;
		tiers = [...tiers];
		calculateTierLabelWidth();
		saveToLocalStorage();
	}

	function toggleColorPicker(tierId) {
		if (showColorPickerForTier === tierId) {
			showColorPickerForTier = null;
		} else {
			showColorPickerForTier = tierId;
		}
	}

	function selectTierColor(tierId, color) {
		updateTierColor(tierId, color);
		showColorPickerForTier = null;
	}

	function highlightChampion(championId) {
		if (highlighterMode === 'erase') {
			if (championHighlights[championId]) {
				delete championHighlights[championId];
				championHighlights = { ...championHighlights };
				saveToLocalStorage();
			}
		} else if (selectedHighlightColor) {
			if (championHighlights[championId] === selectedHighlightColor) {
				delete championHighlights[championId];
			} else {
				championHighlights[championId] = selectedHighlightColor;
			}
			championHighlights = { ...championHighlights };
			saveToLocalStorage();
		}
	}

	function handleChampionClick(tierId, itemId) {
		if (clickTimer) {
			// Double click detected
			clearTimeout(clickTimer);
			clickTimer = null;
			returnToPool(tierId, itemId);
		} else {
			// Wait to see if it's a double click
			clickTimer = setTimeout(() => {
				clickTimer = null;
				highlightChampion(itemId);
			}, DOUBLE_CLICK_DELAY);
		}
	}

	function removeHighlight(championId) {
		delete championHighlights[championId];
		championHighlights = { ...championHighlights };
		saveToLocalStorage();
	}

	function resetHighlights() {
		championHighlights = {};
		saveToLocalStorage();
	}

	function hueToRgb(hue) {
		const h = hue / 360;
		const s = 1;
		const l = 0.5;

		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
		const g = Math.round(hue2rgb(p, q, h) * 255);
		const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	function rgbToHue(hexColor) {
		// Convert hex to RGB
		const r = parseInt(hexColor.slice(1, 3), 16) / 255;
		const g = parseInt(hexColor.slice(3, 5), 16) / 255;
		const b = parseInt(hexColor.slice(5, 7), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		let hue = 0;
		if (delta !== 0) {
			if (max === r) {
				hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
			} else if (max === g) {
				hue = ((b - r) / delta + 2) / 6;
			} else {
				hue = ((r - g) / delta + 4) / 6;
			}
		}

		return hue * 360;
	}

	let currentCustomSlider = null;
	let currentActiveSlotIndex = null;

	function handleColorSliderMouseDown(e, slotIndex, sliderElement) {
		e.preventDefault();
		e.stopPropagation();
		isDraggingColor = true;
		currentCustomSlider = sliderElement;
		currentActiveSlotIndex = slotIndex;

		const rect = sliderElement.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		customColorHue = percentage * 360;

		if (typeof document !== 'undefined') {
			document.addEventListener('mousemove', handleColorSliderDragGlobal);
			document.addEventListener('mouseup', handleColorSliderMouseUp);
		}
	}

	function handleColorSliderDragGlobal(e) {
		if (!isDraggingColor || !currentCustomSlider || currentActiveSlotIndex === null) {
			// Sıkışmış durumu temizle
			cleanupColorSliderEvents();
			return;
		}
		const rect = currentCustomSlider.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		customColorHue = percentage * 360;
	}

	function cleanupColorSliderEvents() {
		isDraggingColor = false;
		currentCustomSlider = null;
		currentActiveSlotIndex = null;
		if (typeof document !== 'undefined') {
			document.removeEventListener('mousemove', handleColorSliderDragGlobal);
			document.removeEventListener('mouseup', handleColorSliderMouseUp);
		}
	}

	function handleColorSliderMouseUp() {
		if (isDraggingColor && currentActiveSlotIndex !== null) {
			const newColor = hueToRgb(customColorHue);
			customColors[currentActiveSlotIndex] = newColor;
			customColors = [...customColors];
			selectedHighlightColor = newColor;
			highlighterMode = 'color';
			saveToLocalStorage();
		}
		cleanupColorSliderEvents();
	}

	function addCustomColorSlot() {
		if (customColors.length < maxCustomColors) {
			customColors = [...customColors, '#ffffff'];
			saveToLocalStorage();
		}
	}

	function removeCustomColorSlot(index) {
		if (customColors.length > 1) {
			customColors = customColors.filter((_, i) => i !== index);
			if (activeColorSlot === index) {
				activeColorSlot = null;
			} else if (activeColorSlot > index) {
				activeColorSlot--;
			}
			saveToLocalStorage();
		}
	}

	let currentTierSlider = null;
	let currentActiveTierId = null;

	function handleTierColorSliderMouseDown(e, tierId, sliderElement) {
		e.preventDefault();
		e.stopPropagation();
		isDraggingTierColor = true;
		currentTierSlider = sliderElement;
		currentActiveTierId = tierId;

		const rect = sliderElement.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		tierCustomColorHue = percentage * 360;

		if (typeof document !== 'undefined') {
			document.addEventListener('mousemove', handleTierColorSliderDragGlobal);
			document.addEventListener('mouseup', handleTierColorSliderMouseUp);
		}
	}

	function handleTierColorSliderDragGlobal(e) {
		if (!isDraggingTierColor || !currentTierSlider || !currentActiveTierId) {
			// Sıkışmış durumu temizle
			cleanupTierColorSliderEvents();
			return;
		}
		const rect = currentTierSlider.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		tierCustomColorHue = percentage * 360;
	}

	function cleanupTierColorSliderEvents() {
		isDraggingTierColor = false;
		currentTierSlider = null;
		currentActiveTierId = null;
		if (typeof document !== 'undefined') {
			document.removeEventListener('mousemove', handleTierColorSliderDragGlobal);
			document.removeEventListener('mouseup', handleTierColorSliderMouseUp);
		}
	}

	function handleTierColorSliderMouseUp() {
		if (isDraggingTierColor && currentActiveTierId) {
			const newColor = hueToRgb(tierCustomColorHue);
			updateTierColor(currentActiveTierId, newColor);
		}
		cleanupTierColorSliderEvents();
	}

	function newTierList() {
		// Bekleyen kaydetme işlemini iptal et
		if (saveDebounceTimer) {
			clearTimeout(saveDebounceTimer);
			saveDebounceTimer = null;
		}

		tiers = [
			{ id: 'z', name: 'Z', color: '#9b59b6', champions: [], items: [] },
			{ id: 's', name: 'S', color: '#e74c3c', champions: [], items: [] },
			{ id: 'a', name: 'A', color: '#ff8c00', champions: [], items: [] },
			{ id: 'b', name: 'B', color: '#2ecc71', champions: [], items: [] },
			{ id: 'c', name: 'C', color: '#1abc9c', champions: [], items: [] },
			{ id: 'd', name: 'D', color: '#3498db', champions: [], items: [] }
		];
		championPool = [...allChampions];
		itemPool = [...allItems];
		championHighlights = {};
		selectedRoles = [];
		searchQuery = '';
		calculateTierLabelWidth();
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			localStorage.removeItem('tierlist-state');
		}
	}

	function saveToLocalStorageImmediate() {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			const state = {
				tiers,
				championHighlights,
				customColors,
				activeTab
			};
			localStorage.setItem('tierlist-state', JSON.stringify(state));
		}
	}

	function saveToLocalStorage() {
		if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
		saveDebounceTimer = setTimeout(() => {
			saveToLocalStorageImmediate();
			saveDebounceTimer = null;
		}, SAVE_DEBOUNCE_MS);
	}

	function loadFromLocalStorage() {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('tierlist-state');
			if (saved) {
				const state = JSON.parse(saved);
				championHighlights = state.championHighlights || {};
				customColors = state.customColors && state.customColors.length > 0 ? state.customColors : ['#ffffff'];
				activeTab = state.activeTab || 'champions';

				// Create lookup maps for fresh data
				const championsMap = new Map(allChampions.map(c => [c.id, c]));
				const itemsMap = new Map(allItems.map(i => [i.id, i]));

				// Rebuild tiers with fresh champion/item data
				const championsInTiers = new Set();
				const itemsInTiers = new Set();

				tiers = (state.tiers || tiers).map(tier => {
					// Ensure tier has both champions and items arrays
					const champions = (tier.champions || [])
						.map(c => championsMap.get(c.id))
						.filter(c => c !== undefined);

					const items = (tier.items || [])
						.map(i => itemsMap.get(i.id))
						.filter(i => i !== undefined);

					champions.forEach(c => championsInTiers.add(c.id));
					items.forEach(i => itemsInTiers.add(i.id));

					return {
						...tier,
						champions,
						items
					};
				});

				championPool = allChampions.filter(champ => !championsInTiers.has(champ.id));
				itemPool = allItems.filter(item => !itemsInTiers.has(item.id));

				calculateTierLabelWidth();
			}
		}
	}

	function handleClickOutside(event) {
		if (activeColorSlot !== null) {
			const target = event.target;
			const isStaticColorPicker = target.closest('.static-color-picker');
			const isColorPickerIcon = target.closest('.color-picker-icon');

			if (!isStaticColorPicker && !isColorPickerIcon) {
				activeColorSlot = null;
			}
		}

		if (showColorPickerForTier !== null) {
			const target = event.target;
			const isColorPickerDropdown = target.closest('.color-picker-dropdown');
			const isColorCircle = target.closest('.color-circle');

			if (!isColorPickerDropdown && !isColorCircle) {
				showColorPickerForTier = null;
			}
		}
	}

	// Sayfa dışına çıkıldığında drag'i temizle
	function handleWindowBlur() {
		stopAutoScroll();
		cleanupColorSliderEvents();
		cleanupTierColorSliderEvents();
	}

	onMount(async () => {
		// Load data from API
		const data = await initializeData();
		allChampions = data.champions;
		allItems = data.items;
		championPool = [...allChampions];
		itemPool = [...allItems];
		dataReady = true;

		loadFromLocalStorage();
		calculateTierLabelWidth();

		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			// Drag sırasında auto-scroll için mousemove
			document.addEventListener('mousemove', handleMouseMoveDuringDrag);
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('blur', handleWindowBlur);
		}
	});

	onDestroy(() => {
		// Unsubscribe from language store
		if (unsubscribeLanguage) unsubscribeLanguage();

		// Clear timers
		if (clickTimer) clearTimeout(clickTimer);
		if (saveDebounceTimer) {
			clearTimeout(saveDebounceTimer);
			saveToLocalStorageImmediate(); // Save before destroying
		}

		if (typeof document !== 'undefined') {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('mousemove', handleMouseMoveDuringDrag);
		}
		stopAutoScroll();
		if (typeof window !== 'undefined') {
			window.removeEventListener('blur', handleWindowBlur);
		}
		// Cleanup any stuck events
		cleanupColorSliderEvents();
		cleanupTierColorSliderEvents();
	});
</script>

<svelte:head>
	<title>LoL Tier List Oluştur - Şampiyon ve Item Sıralama | Albatros</title>
	<meta name="description" content="League of Legends şampiyon ve item tier list aracı. Sürükle-bırak ile kendi tier listeni oluştur. Z, S, A, B, C, D tier'larına şampiyonları yerleştir, renklendirme ve highlighter özellikleriyle özelleştir." />
	<meta property="og:title" content="LoL Tier List Oluştur - Şampiyon ve Item Sıralama" />
	<meta property="og:description" content="League of Legends şampiyon tier list oluşturma aracı. Tüm şampiyonları tier'lara yerleştir." />
	<meta property="og:url" content="/tierlist" />
</svelte:head>

{#if !dataReady}
<div class="skeleton-page">
	<div class="skeleton-header">
		<div class="skeleton-box" style="width: 120px; height: 28px;"></div>
		<div class="skeleton-box" style="width: 200px; height: 36px; border-radius: 6px;"></div>
		<div class="skeleton-box" style="width: 300px; height: 36px; border-radius: 6px;"></div>
	</div>
	<div class="skeleton-tiers">
		{#each Array(6) as _, i}
			<div class="skeleton-tier">
				<div class="skeleton-tier-label"></div>
				<div class="skeleton-tier-content">
					{#each Array(3 + Math.floor(Math.random() * 4)) as _}
						<div class="skeleton-champion"></div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div class="skeleton-pool">
		{#each Array(24) as _}
			<div class="skeleton-champion"></div>
		{/each}
	</div>
</div>
{:else}
<div class="tierlist-page">
	<div class="page-header">
		<h1 class="page-title">{t.tierList}</h1>
		<div class="tab-buttons">
			<button
				class="tab-btn"
				class:active={activeTab === 'champions'}
				on:click={() => {
					activeTab = 'champions';
					searchQuery = '';
					saveToLocalStorage();
				}}
			>
				{t.champions}
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'items'}
				on:click={() => {
					activeTab = 'items';
					searchQuery = '';
					saveToLocalStorage();
				}}
			>
				{t.items}
			</button>
		</div>
		<div class="top-navbar">
			<button class="nav-btn" on:click={newTierList}>
				{t.new}
			</button>
			<button class="nav-btn" class:active={showEditPanel} on:click={toggleEditPanel}>
				{t.editTiers}
			</button>
			<button class="nav-btn" class:active={showHighlighterPanel} on:click={toggleHighlighterPanel}>
				{t.highlighter}
			</button>
		</div>
	</div>

	<div class="content-wrapper">
		<div class="tiers-container" bind:this={tiersContainerEl}>
			{#each tiers as tier, index (tier.id)}
				<div class="tier-row">
					<div class="tier-label" style="background-color: {tier.color}; width: {tierLabelWidth}px; min-width: {tierLabelWidth}px; max-width: {tierLabelWidth}px;">
						{tier.name}
					</div>
					<div
						class="tier-drop-zone"
						style={activeTab === 'items' ? 'gap: 8px;' : ''}
						use:dndzone={{
							items: activeTab === 'champions' ? tier.champions : tier.items,
							flipDurationMs,
							dropTargetStyle: { outline: '2px dashed rgba(255, 255, 255, 0.3)', outlineOffset: '2px' },
							dropFromOthersDisabled: false,
							morphDisabled: true,
							dragDisabled: false
						}}
						on:consider={(e) => handleTierDrop(tier.id, e)}
						on:finalize={(e) => handleTierDrop(tier.id, e)}
					>
						{#each activeTab === 'champions' ? tier.champions : tier.items as item (item.id)}
							<div
								class="champion-in-tier"
								style="outline: {championHighlights[item.id] ? '5px solid ' + championHighlights[item.id] : 'none'}; outline-offset: -5px;"
								on:click={() => handleChampionClick(tier.id, item.id)}
								on:contextmenu|preventDefault={() => returnToPool(tier.id, item.id)}
								role="button"
								tabindex="0"
							>
								<img src={getItemImageSrc(item)} alt={item.name} />
								<div class="champion-tooltip">{item.name}</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<div class="champion-pool-section">
				<div class="search-and-filters">
					<input
						type="text"
						class="search-input"
						class:with-roles={activeTab === 'champions'}
						placeholder={activeTab === 'champions' ? t.searchChampions : t.searchItems}
						bind:value={searchQuery}
					/>
					{#if activeTab === 'champions'}
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
					{/if}
				</div>
				<div
					class="champion-pool"
					style={activeTab === 'items' ? 'gap: 8px;' : ''}
					use:dndzone={{
						items: filteredItems,
						flipDurationMs,
						dropTargetStyle: { outline: '2px dashed rgba(255, 255, 255, 0.3)', outlineOffset: '2px' },
						dropFromOthersDisabled: false,
						morphDisabled: true,
						dragDisabled: false
					}}
					on:consider={handlePoolDrop}
					on:finalize={handlePoolDrop}
				>
					{#each filteredItems as item (item.id)}
						<div
							class="champion-icon"
							style="outline: {championHighlights[item.id] ? '5px solid ' + championHighlights[item.id] : 'none'}; outline-offset: -5px;"
							on:click={() => highlightChampion(item.id)}
							on:contextmenu|preventDefault={() => removeHighlight(item.id)}
							role="button"
							tabindex="0"
						>
							<img src={getItemImageSrc(item)} alt={item.name} loading="lazy" />
							<div class="champion-tooltip">{item.name}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		{#if showEditPanel}
			<div class="side-panel">
				<div class="panel-header">
					<h3>{t.editTierList}</h3>
					<button class="close-btn" on:click={() => (showEditPanel = false)}>×</button>
				</div>
				<div class="panel-content">
					<p class="panel-subtitle">{t.championTierList}</p>
					<div
						class="tier-edit-list"
						use:dndzone={{
							items: tiers,
							flipDurationMs: 200,
							dropTargetStyle: {}
						}}
						on:consider={handleTiersDndConsider}
						on:finalize={handleTiersDndFinalize}
					>
						{#each tiers as tier (tier.id)}
							<div class="tier-edit-item">
								<div class="tier-edit-row">
									<div class="drag-handle">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
											<path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM13 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
										</svg>
									</div>
									<div
										class="color-circle"
										style="background-color: {tier.color}"
										on:click={() => toggleColorPicker(tier.id)}
										role="button"
										tabindex="0"
									></div>
									<input
										class="tier-name-input"
										type="text"
										maxlength="25"
										bind:value={tier.name}
										on:input={(e) => updateTierName(tier.id, e.target.value)}
									/>
									<button class="icon-btn delete" on:click={() => deleteTier(tier.id)}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
											<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
										</svg>
									</button>
								</div>
								{#if showColorPickerForTier === tier.id}
									<div class="color-picker-dropdown" on:click|stopPropagation>
										<div class="preset-colors">
											{#each tierColorOptions as colorOption}
												<div
													class="color-option"
													style="background-color: {colorOption.value}"
													on:click={() => selectTierColor(tier.id, colorOption.value)}
													role="button"
													tabindex="0"
													title={colorOption.name}
												></div>
											{/each}
										</div>
										<div class="custom-color-section">
											<p class="custom-color-label">{t.customColor}</p>
											<div
												class="tier-color-slider"
												on:mousedown={(e) => handleTierColorSliderMouseDown(e, tier.id, e.currentTarget)}
												role="slider"
												tabindex="0"
											>
												<div
													class="tier-color-slider-thumb"
													style="left: {(tierCustomColorHue / 360) * 100}%; background-color: {hueToRgb(tierCustomColorHue)}"
												></div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<button class="add-tier-btn" on:click={addTier}>
						{t.addTier}
					</button>
				</div>
			</div>
		{/if}

		{#if showHighlighterPanel}
			<div class="side-panel">
				<div class="panel-header">
					<h3>{t.highlighterPanel}</h3>
					<button class="close-btn" on:click={() => (showHighlighterPanel = false)}>×</button>
				</div>
				<div class="panel-content">
					<p class="panel-subtitle">{t.clickToHighlight}</p>
					<div class="highlight-colors">
						{#each highlightColors as color}
							<div
								class="highlight-color"
								class:selected={selectedHighlightColor === color}
								style="background-color: {color}"
								on:click={() => {
									if (selectedHighlightColor === color) {
										selectedHighlightColor = null;
									} else {
										selectedHighlightColor = color;
										highlighterMode = 'color';
									}
								}}
								role="button"
								tabindex="0"
							></div>
						{/each}
					</div>
					<p class="panel-subtitle" style="margin-top: 20px;">{t.customColors}</p>
					<div class="custom-colors-grid">
						{#each customColors as customColor, index}
							<div class="custom-color-slot-wrapper">
								<div
									class="highlight-color"
									class:selected={selectedHighlightColor === customColor && activeColorSlot !== index}
									style="background-color: {customColor}"
									on:click={() => {
										if (selectedHighlightColor === customColor) {
											selectedHighlightColor = null;
										} else {
											selectedHighlightColor = customColor;
											highlighterMode = 'color';
										}
									}}
									on:contextmenu|preventDefault={() => removeCustomColorSlot(index)}
									role="button"
									tabindex="0"
								>
									<div
										class="color-picker-icon"
										on:click|stopPropagation={() => {
											if (activeColorSlot === index) {
												activeColorSlot = null;
											} else {
												activeColorSlot = index;
												customColorHue = rgbToHue(customColors[index]);
											}
										}}
										role="button"
										tabindex="0"
										title="Renk seçici"
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
										</svg>
									</div>
								</div>
							</div>
						{/each}
					</div>
					{#if customColors.length < maxCustomColors}
						<div class="add-color-row">
							<button class="add-color-btn-full" on:click={addCustomColorSlot}>
								<span>+</span>
							</button>
						</div>
					{/if}
					{#if activeColorSlot !== null}
						<div class="static-color-picker" on:click|stopPropagation>
							<p class="color-picker-label">Renk Seçici - Slot {activeColorSlot + 1}</p>
							<div
								class="color-slider"
								on:mousedown={(e) => handleColorSliderMouseDown(e, activeColorSlot, e.currentTarget)}
								role="slider"
								tabindex="0"
							>
								<div
									class="color-slider-thumb"
									style="left: {(customColorHue / 360) * 100}%; background-color: {hueToRgb(customColorHue)}"
								></div>
							</div>
						</div>
					{/if}
					<div class="highlighter-actions">
						<button class="highlighter-btn" on:click={resetHighlights}>{t.reset}</button>
						<button
							class="highlighter-btn"
							class:active={highlighterMode === 'erase'}
							on:click={() => {
								if (highlighterMode === 'erase') {
									highlighterMode = 'color';
									selectedHighlightColor = null;
								} else {
									highlighterMode = 'erase';
									selectedHighlightColor = null;
								}
							}}
						>
							{t.erase}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
{/if}

<style>
	.skeleton-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #000;
		padding: 16px;
		gap: 12px;
		overflow: hidden;
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 0;
	}

	.skeleton-box {
		background: #1a1a1a;
		border-radius: 4px;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-tiers {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.skeleton-tier {
		display: flex;
		align-items: stretch;
		min-height: 68px;
	}

	.skeleton-tier-label {
		width: 100px;
		background: #1a1a1a;
		border-radius: 4px 0 0 4px;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-tier-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px;
		background: #0d0d0d;
		border-radius: 0 4px 4px 0;
	}

	.skeleton-champion {
		width: 52px;
		height: 52px;
		border-radius: 6px;
		background: #1a1a1a;
		flex-shrink: 0;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-pool {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 12px;
		background: #0d0d0d;
		border-radius: 8px;
		min-height: 120px;
	}

	@keyframes skeleton-pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.8; }
	}

	.tierlist-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #000;
		background-image: url('/leagueoflegendsmap.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
	}

	.tierlist-page::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		z-index: 0;
	}

	.tierlist-page > * {
		position: relative;
		z-index: 1;
	}

	.page-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20px 30px;
		background-color: rgba(0, 0, 0, 0.5);
		border-bottom: 1px solid #0d0d0d;
		position: relative;
		gap: 30px;
	}

	.page-title {
		font-size: 24px;
		font-weight: 600;
		color: #fff;
		margin: 0;
		letter-spacing: 0.5px;
		text-align: center;
		position: absolute;
		left: 30px;
	}

	.tab-buttons {
		display: flex;
		gap: 0;
		background-color: #0d0d0d;
		border-radius: 6px;
		padding: 4px;
		border: 1px solid #1a1a1a;
	}

	.tab-btn {
		background-color: transparent;
		border: none;
		color: #888;
		padding: 8px 24px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0.3px;
	}

	.tab-btn:hover {
		color: #aaa;
	}

	.tab-btn.active {
		background-color: #1a1a1a;
		color: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.top-navbar {
		display: flex;
		gap: 0;
		z-index: 10;
		position: absolute;
		right: 30px;
	}

	.nav-btn {
		background-color: transparent;
		border: none;
		color: #fff;
		padding: 10px 20px;
		font-size: 15px;
		font-weight: 600;
		border-radius: 0;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.nav-btn:hover {
		background-color: rgba(255, 255, 255, 0.05);
		color: #fff;
	}

	.nav-btn.active {
		color: #fff;
	}

	.content-wrapper {
		display: flex;
		flex: 1;
		overflow: hidden;
		justify-content: center;
	}

	.tiers-container {
		flex: 1;
		max-width: 1600px;
		width: 100%;
		overflow-y: auto;
		padding: 0 40px;
		margin: 0 auto;
	}

	.tier-row {
		display: flex;
		align-items: stretch;
		margin-bottom: 0;
		min-height: 102px;
		border-radius: 0;
		overflow: visible;
		box-shadow: none;
		position: relative;
		background-color: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tier-label {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 8px;
		padding-right: 8px;
		font-size: 28px;
		font-weight: 700;
		color: #fff;
		text-shadow: none;
		text-align: center;
		line-height: 1.2;
		letter-spacing: 0;
		border-radius: 12px;
		word-break: keep-all;
		overflow-wrap: break-word;
		hyphens: none;
		white-space: normal;
		min-height: 102px;
	}

	.tier-drop-zone {
		flex: 1;
		background-color: rgba(0, 0, 0, 0.3);
		padding: 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		align-items: center;
		align-content: flex-start;
		min-height: 102px;
		border-radius: 0;
		overflow: visible;
	}

	.champion-in-tier {
		position: relative;
		cursor: move;
		transition: all 0.2s;
		border: none;
		border-radius: 4px;
		box-shadow: none;
	}

	.champion-in-tier:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.champion-in-tier img {
		width: 84px;
		height: 84px;
		border-radius: 4px;
		display: block;
	}

	.champion-pool-section {
		margin-top: 0;
		padding: 15px 30px;
	}

	.search-and-filters {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 15px;
	}

	.search-input {
		flex: 1;
		padding: 10px 15px;
		background-color: #0a0a0a;
		border: 1px solid #1a1a1a;
		border-radius: 4px;
		color: #fff;
		font-size: 13px;
		transition: all 0.2s;
	}

	.search-input.with-roles {
		max-width: 300px;
	}

	.search-input::placeholder {
		color: #666;
	}

	.search-input:focus {
		outline: none;
		border-color: #2a2a2a;
		background-color: #0d0d0d;
	}

	.role-filters {
		display: flex;
		gap: 6px;
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
		width: 40px;
		height: 40px;
		opacity: 0.6;
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
		width: 26px;
		height: 26px;
		object-fit: contain;
		filter: brightness(1.2);
	}

	.champion-pool {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		padding: 15px;
		background-color: rgba(0, 0, 0, 0.4);
		border-radius: 0;
		box-shadow: none;
		border: none;
		border-top: 1px solid #0d0d0d;
	}

	.champion-icon {
		position: relative;
		cursor: move;
		transition: all 0.2s;
		border: none;
		border-radius: 4px;
		box-shadow: none;
	}

	.champion-icon:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.champion-icon img {
		width: 84px;
		height: 84px;
		border-radius: 4px;
		display: block;
	}

	.champion-tooltip {
		position: absolute;
		bottom: -30px;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.95);
		color: #fff;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.3px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
		z-index: 1000;
		border: 1px solid #3a3a3a;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
	}

	.champion-icon:hover {
		position: relative;
		z-index: 100;
	}

	.champion-in-tier:hover {
		position: relative;
		z-index: 100;
	}

	.champion-icon:hover .champion-tooltip,
	.champion-in-tier:hover .champion-tooltip {
		opacity: 1;
	}

	.side-panel {
		width: 340px;
		background-color: #0a0a0a;
		border-left: 1px solid #1a1a1a;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s ease-out;
		box-shadow: -4px 0 16px rgba(0, 0, 0, 0.5);
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 20px 15px 20px;
		border-bottom: none;
		background-color: transparent;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 18px;
		color: #fff;
		font-weight: 600;
		letter-spacing: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: #666;
		font-size: 28px;
		cursor: pointer;
		padding: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 0 20px 20px 20px;
	}

	.panel-subtitle {
		color: #aaa;
		font-size: 14px;
		margin-bottom: 20px;
		font-weight: 400;
	}

	.tier-edit-list {
		display: flex;
		flex-direction: column;
	}

	.tier-edit-item {
		margin-bottom: 16px;
		position: relative;
		transform: translateZ(0);
		will-change: transform;
	}

	.tier-edit-row {
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 8px 0;
		background-color: transparent;
		border-radius: 0;
		border: none;
		transition: all 0.2s;
		cursor: move;
	}

	.tier-edit-row:hover .tier-name-input {
		color: #fff;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		cursor: grab;
		transition: color 0.2s;
		flex-shrink: 0;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.tier-edit-row:hover .drag-handle {
		color: #aaa;
	}

	.color-circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		flex-shrink: 0;
		cursor: pointer;
		border: 2px solid transparent;
		transition: all 0.2s;
	}

	.color-circle:hover {
		border-color: #fff;
		transform: scale(1.1);
	}

	.color-picker-dropdown {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
		background-color: #0d0d0d;
		border-radius: 6px;
		margin-top: 8px;
		margin-left: 47px;
		border: 1px solid #1a1a1a;
		animation: slideDown 0.2s ease-out;
		will-change: transform;
		transform: translateZ(0);
	}

	.preset-colors {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.custom-color-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px solid #1a1a1a;
	}

	.custom-color-label {
		font-size: 12px;
		color: #888;
		margin: 0;
		font-weight: 500;
	}

	.tier-color-slider {
		width: 100%;
		height: 28px;
		background: linear-gradient(to right,
			#ff0000 0%,
			#ffff00 16.67%,
			#00ff00 33.33%,
			#00ffff 50%,
			#0000ff 66.67%,
			#ff00ff 83.33%,
			#ff0000 100%
		);
		border-radius: 14px;
		position: relative;
		cursor: pointer;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	.tier-color-slider-thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 3px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		pointer-events: none;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.color-option {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		cursor: pointer;
		border: 2px solid transparent;
		transition: all 0.2s;
	}

	.color-option:hover {
		border-color: #fff;
		transform: scale(1.1);
	}

	.tier-name-input {
		flex: 1;
		background-color: transparent;
		border: none;
		color: #ddd;
		padding: 8px 0;
		font-size: 16px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.tier-name-input:focus {
		outline: none;
		color: #fff;
	}

	.icon-btn {
		background-color: transparent;
		border: none;
		color: #777;
		width: 36px;
		height: 36px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.icon-btn:hover:not(:disabled) {
		color: #fff;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.icon-btn:disabled {
		opacity: 0.2;
		cursor: not-allowed;
	}

	.icon-btn.delete {
		color: #888;
	}

	.icon-btn.delete:hover {
		color: #ef4444;
		background-color: rgba(239, 68, 68, 0.1);
	}

	.add-tier-btn {
		width: 100%;
		padding: 14px;
		background-color: transparent;
		border: 1px solid #2a2a2a;
		color: #ddd;
		font-size: 14px;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-tier-btn:hover {
		background-color: rgba(255, 255, 255, 0.05);
		border-color: #3a3a3a;
		color: #fff;
	}

	.highlight-colors {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.highlight-color {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s;
		border: 3px solid transparent;
	}

	.highlight-color:hover {
		transform: scale(1.1);
	}

	.highlight-color.selected {
		border-color: #fff;
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.highlight-colors {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		margin-bottom: 20px;
	}

	.highlight-color {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		border: 2px solid transparent;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
	}

	.highlight-color:hover {
		transform: scale(1.05);
	}

	.highlight-color.selected {
		border-color: #FF1744;
		box-shadow: 0 0 0 2px #0d0d0d, 0 0 0 4px #FF1744;
	}

	.custom-colors-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		margin-bottom: 20px;
	}

	.custom-color-slot-wrapper {
		position: relative;
		transform: translateZ(0);
		will-change: transform;
	}

	.highlight-color {
		position: relative;
	}

	.color-picker-icon {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 20px;
		height: 20px;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 10;
		color: #fff;
		opacity: 0.7;
	}

	.color-picker-icon:hover {
		opacity: 1;
		background-color: rgba(0, 0, 0, 0.8);
		transform: scale(1.1);
	}

	.color-picker-icon svg {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}

	.add-color-row {
		margin-top: 10px;
		margin-bottom: 10px;
	}

	.add-color-btn-full {
		width: 100%;
		padding: 12px;
		background-color: #252525;
		border: 2px dashed #3a3a3a;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 24px;
		font-weight: 700;
	}

	.add-color-btn-full:hover {
		background-color: #2a2a2a;
		border-color: #4a4a4a;
		color: #888;
	}

	.static-color-picker {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		margin-top: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
	}

	.color-picker-label {
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		margin: 0 0 12px 0;
		text-align: center;
	}

	.color-slider {
		width: 100%;
		height: 32px;
		background: linear-gradient(to right,
			#ff0000 0%,
			#ffff00 16.67%,
			#00ff00 33.33%,
			#00ffff 50%,
			#0000ff 66.67%,
			#ff00ff 83.33%,
			#ff0000 100%
		);
		border-radius: 16px;
		position: relative;
		cursor: pointer;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	.color-slider-thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 3px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		pointer-events: none;
	}

	.highlighter-actions {
		display: flex;
		gap: 10px;
		flex-direction: column;
	}

	.highlighter-btn {
		padding: 10px;
		background-color: #0a0a0a;
		border: 1px solid #1a1a1a;
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.highlighter-btn:hover {
		background-color: #0d0d0d;
		border-color: #2a2a2a;
	}

	.highlighter-btn.active {
		background-color: #FF1744;
		border-color: #FF1744;
		color: #fff;
	}
</style>
