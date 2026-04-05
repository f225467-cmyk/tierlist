import { writable, get } from 'svelte/store';

export const language = writable('EN');

// API configuration - environment variable veya varsayılan
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// ============ AUTH ============

// Auth token store - localStorage'dan okur/yazar
function createAuthStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
	const store = writable(stored);

	store.subscribe(value => {
		if (typeof localStorage !== 'undefined') {
			if (value) {
				localStorage.setItem('authToken', value);
			} else {
				localStorage.removeItem('authToken');
			}
		}
	});

	return store;
}

export const authToken = createAuthStore();

// Login - API'ye POST, token'ı store'a kaydet
export async function login(password) {
	const res = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password })
	});

	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.error || 'Giriş başarısız');
	}

	const { token } = await res.json();
	authToken.set(token);
	return token;
}

// Logout - token'ı sil
export function logout() {
	authToken.set(null);
}

// authFetch - her isteğe Authorization header ekler, 401'de auto-logout
export async function authFetch(url, options = {}) {
	const token = get(authToken);
	const headers = { ...options.headers };

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(url, { ...options, headers });

	if (res.status === 401) {
		logout();
		throw new Error('AUTH_EXPIRED');
	}

	return res;
}

// ============ DATA STORES ============

// Champions store
export const championsStore = writable([]);
export const itemsStore = writable([]);
export const dataLoaded = writable(false);

// Fetch champions from API
export async function fetchChampionsFromAPI() {
	try {
		const res = await fetch(`${API_URL}/champions`);
		if (res.ok) {
			const data = await res.json();
			championsStore.set(data);
			return data;
		}
	} catch (err) {
		console.error('Failed to fetch champions from API:', err);
	}
	return [];
}

// Fetch items from API
export async function fetchItemsFromAPI() {
	try {
		const res = await fetch(`${API_URL}/items`);
		if (res.ok) {
			const data = await res.json();
			itemsStore.set(data);
			return data;
		}
	} catch (err) {
		console.error('Failed to fetch items from API:', err);
	}
	return [];
}

// Initialize data - try API first, fallback to static
export async function initializeData() {
	let champions = await fetchChampionsFromAPI();
	let items = await fetchItemsFromAPI();

	// If API returned empty data, initialize from static files
	if (champions.length === 0) {
		try {
			const { champions: staticChampions } = await import('./champions.js');
			await authFetch(`${API_URL}/init/champions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ champions: staticChampions })
			});
			champions = await fetchChampionsFromAPI();
		} catch (err) {
			// Fallback to static data if API fails
			const { champions: staticChampions } = await import('./champions.js');
			champions = staticChampions;
			championsStore.set(champions);
		}
	}

	if (items.length === 0) {
		try {
			const { items: staticItems } = await import('./items.js');
			await authFetch(`${API_URL}/init/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: staticItems })
			});
			items = await fetchItemsFromAPI();
		} catch (err) {
			// Fallback to static data if API fails
			const { items: staticItems } = await import('./items.js');
			items = staticItems;
			itemsStore.set(items);
		}
	}

	dataLoaded.set(true);
	return { champions, items };
}

// Get image URL (handle both static and API images)
export function getImageUrl(image) {
	if (!image) return '/champions/default.png';
	if (image.startsWith('/uploads/') || image.startsWith('/api/images/')) {
		return `${API_BASE_URL}${image}`;
	}
	return image;
}

export const translations = {
	EN: {
		tierLists: 'Tier List',
		drafting: 'Draft',
		admin: 'Admin',
		new: 'New',
		editTiers: 'Edit Tiers',
		highlighter: 'Highlighter',
		reset: 'Reset',
		erase: 'Erase',
		searchChampions: 'Search champions...',
		searchItems: 'Search items...',
		blueSide: 'BLUE SIDE',
		redSide: 'RED SIDE',
		addTier: '+ Add Tier',
		clickToHighlight: 'Click a champion to highlight it.',
		editTierList: 'Edit Tier List',
		highlighterPanel: 'Highlighter',
		championTierList: 'Champion Tier List',
		tierList: 'Tier List',
		customColors: 'Custom Colors',
		customColor: 'Custom Color',
		bluePrefix: 'B',
		redPrefix: 'R',
		champions: 'Champions',
		items: 'Items',
		needCoach: 'Need Coach?'
	},
	KR: {
		tierLists: 'Tier List',
		drafting: 'Draft',
		admin: '관리자',
		new: '새로 만들기',
		editTiers: '티어 편집',
		highlighter: '하이라이터',
		reset: '초기화',
		erase: '지우개',
		searchChampions: '챔피언 검색...',
		searchItems: '아이템 검색...',
		blueSide: '블루 팀',
		redSide: '레드 팀',
		addTier: '+ 티어 추가',
		clickToHighlight: '챔피언을 클릭하여 강조 표시하세요.',
		editTierList: '티어 리스트 편집',
		highlighterPanel: '하이라이터',
		championTierList: '챔피언 티어 리스트',
		tierList: '티어 리스트',
		customColors: '커스텀 색상',
		customColor: '커스텀 색상',
		bluePrefix: 'B',
		redPrefix: 'R',
		champions: '챔피언',
		items: '아이템',
		needCoach: '코치가 필요하신가요?'
	},
	TR: {
		tierLists: 'Tier List',
		drafting: 'Draft',
		admin: 'Yönetici',
		new: 'Yeni',
		editTiers: 'Tier Düzenle',
		highlighter: 'İşaretleyici',
		reset: 'Sıfırla',
		erase: 'Sil',
		searchChampions: 'Şampiyon ara...',
		searchItems: 'Eşya ara...',
		blueSide: 'MAVİ TAKIM',
		redSide: 'KIRMIZI TAKIM',
		addTier: '+ Tier Ekle',
		clickToHighlight: 'Vurgulamak için bir şampiyona tıklayın.',
		editTierList: 'Tier Listesini Düzenle',
		highlighterPanel: 'İşaretleyici',
		championTierList: 'Şampiyon Tier List',
		tierList: 'Tier List',
		customColors: 'Özel Renkler',
		customColor: 'Özel Renk',
		bluePrefix: 'M',
		redPrefix: 'K',
		champions: 'Şampiyonlar',
		items: 'Eşyalar',
		needCoach: 'Koç mu Lazım?'
	}
};
