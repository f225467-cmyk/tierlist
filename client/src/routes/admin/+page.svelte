<script>
	import { onMount } from 'svelte';
	import { language, translations, API_URL, API_BASE_URL, authToken, login, logout, authFetch } from '$lib/stores.js';

	let currentLang = 'EN';
	language.subscribe(value => {
		currentLang = value;
	});
	$: t = translations[currentLang];

	// Auth state
	let isLoggedIn = false;
	let loginPassword = '';
	let loginError = '';
	let loginLoading = false;

	authToken.subscribe(value => {
		isLoggedIn = !!value;
	});

	async function handleLogin() {
		loginError = '';
		loginLoading = true;
		try {
			await login(loginPassword);
			loginPassword = '';
			await loadData();
			await initializeData();
		} catch (err) {
			loginError = err.message || 'Giriş başarısız';
		} finally {
			loginLoading = false;
		}
	}

	function handleLogout() {
		logout();
		champions = [];
		items = [];
	}

	let activeTab = 'champions';
	let champions = [];
	let items = [];
	let loading = true;
	let error = null;

	// Modal states
	let showModal = false;
	let modalMode = 'add'; // 'add' or 'edit'
	let editingItem = null;

	// Bulk selection
	let selectedIds = new Set();
	let bulkSelectMode = false;

	// Form data
	let formName = '';
	let formRoles = [];
	let formImage = null;
	let formImagePreview = null;

	const roles = [
		{ id: 'top', name: 'Top' },
		{ id: 'jungle', name: 'Jungle' },
		{ id: 'mid', name: 'Mid' },
		{ id: 'adc', name: 'ADC' },
		{ id: 'support', name: 'Support' }
	];

	// Fetch data
	async function fetchChampions() {
		try {
			const res = await fetch(`${API_URL}/champions`);
			champions = await res.json();
		} catch (err) {
			console.error('Failed to fetch champions:', err);
		}
	}

	async function fetchItems() {
		try {
			const res = await fetch(`${API_URL}/items`);
			items = await res.json();
		} catch (err) {
			console.error('Failed to fetch items:', err);
		}
	}

	async function loadData() {
		loading = true;
		await Promise.all([fetchChampions(), fetchItems()]);
		loading = false;
	}

	// Initialize data from static files if empty
	async function initializeData() {
		if (champions.length === 0) {
			try {
				const { champions: staticChampions } = await import('$lib/champions.js');
				await authFetch(`${API_URL}/init/champions`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ champions: staticChampions })
				});
				await fetchChampions();
			} catch (err) {
				if (err.message === 'AUTH_EXPIRED') return;
				console.error('Failed to initialize champions:', err);
			}
		}

		if (items.length === 0) {
			try {
				const { items: staticItems } = await import('$lib/items.js');
				await authFetch(`${API_URL}/init/items`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ items: staticItems })
				});
				await fetchItems();
			} catch (err) {
				if (err.message === 'AUTH_EXPIRED') return;
				console.error('Failed to initialize items:', err);
			}
		}
	}

	onMount(async () => {
		if (isLoggedIn) {
			await loadData();
			await initializeData();
		}
	});

	// Modal functions
	function openAddModal() {
		modalMode = 'add';
		formName = '';
		formRoles = [];
		formImage = null;
		formImagePreview = null;
		editingItem = null;
		showModal = true;
	}

	function openEditModal(item) {
		modalMode = 'edit';
		editingItem = item;
		formName = item.name;
		formRoles = item.roles ? [...item.roles] : [];
		formImage = null;
		formImagePreview = getImageUrl(item.image);
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingItem = null;
		formName = '';
		formRoles = [];
		formImage = null;
		formImagePreview = null;
	}

	function toggleRole(roleId) {
		if (formRoles.includes(roleId)) {
			formRoles = formRoles.filter(r => r !== roleId);
		} else {
			formRoles = [...formRoles, roleId];
		}
	}

	function handleImageSelect(event) {
		const file = event.target.files[0];
		if (file) {
			formImage = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				formImagePreview = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	}

	function getImageUrl(image) {
		if (!image) return null;
		if (image.startsWith('/uploads/') || image.startsWith('/api/images/')) {
			return `${API_BASE_URL}${image}`;
		}
		return image;
	}

	// CRUD operations (all use authFetch)
	async function saveItem() {
		if (!formName.trim()) {
			alert('İsim gerekli!');
			return;
		}

		try {
			if (activeTab === 'champions') {
				if (modalMode === 'add') {
					const res = await authFetch(`${API_URL}/champions`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: formName, roles: formRoles })
					});
					const newChampion = await res.json();

					if (formImage) {
						const formData = new FormData();
						formData.append('image', formImage);
						await authFetch(`${API_URL}/champions/${newChampion.id}/image`, {
							method: 'POST',
							body: formData
						});
					}
				} else {
					await authFetch(`${API_URL}/champions/${editingItem.id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: formName, roles: formRoles })
					});

					if (formImage) {
						const formData = new FormData();
						formData.append('image', formImage);
						await authFetch(`${API_URL}/champions/${editingItem.id}/image`, {
							method: 'POST',
							body: formData
						});
					}
				}
				await fetchChampions();
			} else {
				if (modalMode === 'add') {
					const res = await authFetch(`${API_URL}/items`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: formName })
					});
					const newItem = await res.json();

					if (formImage) {
						const formData = new FormData();
						formData.append('image', formImage);
						await authFetch(`${API_URL}/items/${newItem.id}/image`, {
							method: 'POST',
							body: formData
						});
					}
				} else {
					await authFetch(`${API_URL}/items/${editingItem.id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: formName })
					});

					if (formImage) {
						const formData = new FormData();
						formData.append('image', formImage);
						await authFetch(`${API_URL}/items/${editingItem.id}/image`, {
							method: 'POST',
							body: formData
						});
					}
				}
				await fetchItems();
			}

			closeModal();
		} catch (err) {
			if (err.message === 'AUTH_EXPIRED') return;
			console.error('Save error:', err);
			alert('Kaydetme hatası!');
		}
	}

	async function deleteItem(item) {
		const confirmMsg = activeTab === 'champions'
			? `"${item.name}" şampiyonunu silmek istediğinize emin misiniz?`
			: `"${item.name}" itemini silmek istediğinize emin misiniz?`;

		if (!confirm(confirmMsg)) return;

		try {
			if (activeTab === 'champions') {
				await authFetch(`${API_URL}/champions/${item.id}`, { method: 'DELETE' });
				await fetchChampions();
			} else {
				await authFetch(`${API_URL}/items/${item.id}`, { method: 'DELETE' });
				await fetchItems();
			}
		} catch (err) {
			if (err.message === 'AUTH_EXPIRED') return;
			console.error('Delete error:', err);
			alert('Silme hatası!');
		}
	}

	$: currentItems = activeTab === 'champions' ? champions : items;

	// Clear selection when tab changes
	$: if (activeTab) {
		selectedIds = new Set();
		bulkSelectMode = false;
	}

	function toggleBulkSelectMode() {
		bulkSelectMode = !bulkSelectMode;
		if (!bulkSelectMode) {
			selectedIds = new Set();
		}
	}

	function handleRowClick(item) {
		if (!bulkSelectMode) return;

		if (selectedIds.has(item.id)) {
			selectedIds.delete(item.id);
			selectedIds = new Set(selectedIds);
		} else {
			selectedIds.add(item.id);
			selectedIds = new Set(selectedIds);
		}
	}

	async function deleteSelected() {
		if (selectedIds.size === 0) return;

		const confirmMsg = activeTab === 'champions'
			? `${selectedIds.size} şampiyonu silmek istediğinize emin misiniz?`
			: `${selectedIds.size} itemi silmek istediğinize emin misiniz?`;

		if (!confirm(confirmMsg)) return;

		try {
			const endpoint = activeTab === 'champions' ? 'champions' : 'items';

			await Promise.all(
				Array.from(selectedIds).map(id =>
					authFetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' })
				)
			);

			if (activeTab === 'champions') {
				await fetchChampions();
			} else {
				await fetchItems();
			}

			selectedIds = new Set();
			bulkSelectMode = false;
		} catch (err) {
			if (err.message === 'AUTH_EXPIRED') return;
			console.error('Bulk delete error:', err);
			alert('Toplu silme hatası!');
		}
	}
</script>

<svelte:head>
	<title>Admin Panel - Albatros LoL Koçluk</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !isLoggedIn}
	<!-- Login Gate -->
	<div class="login-page">
		<div class="login-card">
			<h1 class="login-title">Admin Panel</h1>
			<p class="login-subtitle">Devam etmek için giriş yapın</p>
			<form on:submit|preventDefault={handleLogin}>
				<div class="login-form-group">
					<input
						type="password"
						bind:value={loginPassword}
						placeholder="Şifre"
						class="login-input"
						disabled={loginLoading}
						autofocus
					/>
				</div>
				{#if loginError}
					<div class="login-error">{loginError}</div>
				{/if}
				<button type="submit" class="login-btn" disabled={loginLoading || !loginPassword}>
					{loginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
				</button>
			</form>
		</div>
	</div>
{:else}
	<!-- Admin Panel -->
	<div class="admin-page">
		<div class="page-header">
			<h1 class="page-title">Admin Panel</h1>
			<div class="tab-buttons">
				<button
					class="tab-btn"
					class:active={activeTab === 'champions'}
					on:click={() => activeTab = 'champions'}
				>
					Şampiyonlar ({champions.length})
				</button>
				<button
					class="tab-btn"
					class:active={activeTab === 'items'}
					on:click={() => activeTab = 'items'}
				>
					Items ({items.length})
				</button>
			</div>
			<div class="header-actions">
				<button
					class="bulk-select-btn"
					class:active={bulkSelectMode}
					on:click={toggleBulkSelectMode}
				>
					{bulkSelectMode ? 'İptal' : 'Toplu Seçim'}
				</button>
				{#if selectedIds.size > 0}
					<button class="delete-selected-btn" on:click={deleteSelected}>
						Seçilenleri Sil ({selectedIds.size})
					</button>
				{/if}
				{#if !bulkSelectMode}
					<button class="add-btn" on:click={openAddModal}>
						+ Yeni Ekle
					</button>
				{/if}
				<button class="logout-btn" on:click={handleLogout}>
					Çıkış Yap
				</button>
			</div>
		</div>

		<div class="content">
			{#if loading}
				<div class="loading">Yükleniyor...</div>
			{:else if currentItems.length === 0}
				<div class="empty">
					{activeTab === 'champions' ? 'Henüz şampiyon yok.' : 'Henüz item yok.'}
				</div>
			{:else}
				<div class="table-container">
					<table class="data-table" class:bulk-mode={bulkSelectMode}>
						<thead>
							<tr>
								<th class="col-image">Resim</th>
								<th class="col-name">İsim</th>
								{#if activeTab === 'champions'}
									<th class="col-roles">Roller</th>
								{/if}
								{#if !bulkSelectMode}
									<th class="col-actions">İşlemler</th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each currentItems as item (item.id)}
								<tr
									class:selected={selectedIds.has(item.id)}
									class:selectable={bulkSelectMode}
									on:click={() => handleRowClick(item)}
								>
									<td class="col-image">
										<img
											src={getImageUrl(item.image)}
											alt={item.name}
											class="item-image"
											on:error={(e) => e.target.src = '/champions/default.png'}
										/>
									</td>
									<td class="col-name">{item.name}</td>
									{#if activeTab === 'champions'}
										<td class="col-roles">
											<div class="role-tags">
												{#each (item.roles || []) as role}
													<span class="role-tag">{role}</span>
												{/each}
											</div>
										</td>
									{/if}
									{#if !bulkSelectMode}
										<td class="col-actions">
											<button class="btn-edit" on:click={() => openEditModal(item)}>
												Düzenle
											</button>
											<button class="btn-delete" on:click={() => deleteItem(item)}>
												Sil
											</button>
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<!-- Modal -->
	{#if showModal}
		<div class="modal-overlay" on:click={closeModal}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h2>{modalMode === 'add' ? 'Yeni Ekle' : 'Düzenle'}</h2>
					<button class="modal-close" on:click={closeModal}>&times;</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label for="name">İsim</label>
						<input
							type="text"
							id="name"
							bind:value={formName}
							placeholder="İsim girin..."
						/>
					</div>

					{#if activeTab === 'champions'}
						<div class="form-group">
							<label>Roller</label>
							<div class="role-checkboxes">
								{#each roles as role}
									<label class="role-checkbox">
										<input
											type="checkbox"
											checked={formRoles.includes(role.id)}
											on:change={() => toggleRole(role.id)}
										/>
										<span>{role.name}</span>
									</label>
								{/each}
							</div>
						</div>
					{/if}

					<div class="form-group">
						<label>Resim</label>
						<div class="image-upload">
							{#if formImagePreview}
								<img src={formImagePreview} alt="Preview" class="image-preview" />
							{:else}
								<div class="image-placeholder">Resim Yok</div>
							{/if}
							<input
								type="file"
								accept="image/*"
								on:change={handleImageSelect}
								id="image-input"
								class="file-input"
							/>
							<label for="image-input" class="file-label">
								Resim Seç
							</label>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" on:click={closeModal}>İptal</button>
					<button class="btn-save" on:click={saveItem}>Kaydet</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Login Page Styles */
	.login-page {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #0a0a0a;
	}

	.login-card {
		background-color: #0d0d0d;
		border: 1px solid #1a1a1a;
		border-radius: 12px;
		padding: 40px;
		width: 380px;
		max-width: 90%;
		text-align: center;
	}

	.login-title {
		color: #fff;
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 8px 0;
	}

	.login-subtitle {
		color: #666;
		font-size: 14px;
		margin: 0 0 32px 0;
	}

	.login-form-group {
		margin-bottom: 16px;
	}

	.login-input {
		width: 100%;
		padding: 14px 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		color: #fff;
		font-size: 15px;
		box-sizing: border-box;
	}

	.login-input:focus {
		outline: none;
		border-color: #FF1744;
	}

	.login-error {
		color: #FF1744;
		font-size: 13px;
		margin-bottom: 16px;
		text-align: left;
	}

	.login-btn {
		width: 100%;
		padding: 14px;
		background-color: #FF1744;
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.login-btn:hover:not(:disabled) {
		background-color: #ff3d5a;
	}

	.login-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Admin Page Styles */
	.admin-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #0a0a0a;
		overflow: hidden;
	}

	.page-header {
		display: flex;
		align-items: center;
		padding: 20px 30px;
		background-color: #000;
		border-bottom: 1px solid #1a1a1a;
		gap: 30px;
	}

	.page-title {
		font-size: 24px;
		font-weight: 600;
		color: #fff;
		margin: 0;
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
	}

	.tab-btn:hover {
		color: #aaa;
	}

	.tab-btn.active {
		background-color: #1a1a1a;
		color: #fff;
	}

	.add-btn {
		background-color: #FF1744;
		border: none;
		color: #fff;
		padding: 10px 24px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-btn:hover {
		background-color: #ff3d5a;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-left: auto;
	}

	.logout-btn {
		background-color: transparent;
		border: 1px solid #3a3a3a;
		color: #aaa;
		padding: 10px 20px;
		font-size: 14px;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background-color: #1a1a1a;
		color: #fff;
		border-color: #555;
	}

	.delete-selected-btn {
		background-color: #dc3545;
		border: none;
		color: #fff;
		padding: 10px 24px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.delete-selected-btn:hover {
		background-color: #c82333;
	}

	.bulk-select-btn {
		background-color: #333;
		border: none;
		color: #fff;
		padding: 10px 24px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.bulk-select-btn:hover {
		background-color: #444;
	}

	.bulk-select-btn.active {
		background-color: #FF1744;
	}

	.bulk-select-btn.active:hover {
		background-color: #ff3d5a;
	}

	.data-table tbody tr.selectable {
		cursor: pointer;
	}

	.data-table tbody tr.selectable:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.data-table tbody tr.selected {
		background-color: rgba(255, 23, 68, 0.2);
		border-left: 3px solid #FF1744;
	}

	.data-table tbody tr.selected:hover {
		background-color: rgba(255, 23, 68, 0.3);
	}

	.content {
		flex: 1;
		overflow: auto;
		padding: 20px 30px;
	}

	.loading, .empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: #888;
		font-size: 16px;
	}

	.table-container {
		background-color: #0d0d0d;
		border-radius: 8px;
		border: 1px solid #1a1a1a;
		overflow: hidden;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th,
	.data-table td {
		padding: 12px 16px;
		text-align: left;
		border-bottom: 1px solid #1a1a1a;
	}

	.data-table th {
		background-color: #151515;
		color: #888;
		font-weight: 600;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.data-table td {
		color: #fff;
	}

	.data-table tbody tr:hover {
		background-color: #151515;
	}

	.col-image {
		width: 80px;
	}

	.col-name {
		width: 200px;
	}

	.col-roles {
		width: 250px;
	}

	.col-actions {
		width: 180px;
	}

	.item-image {
		width: 50px;
		height: 50px;
		border-radius: 6px;
		object-fit: cover;
		background-color: #1a1a1a;
	}

	.role-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.role-tag {
		background-color: #1a1a1a;
		color: #aaa;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.btn-edit, .btn-delete {
		padding: 6px 14px;
		border: none;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		margin-right: 8px;
	}

	.btn-edit {
		background-color: #2a2a2a;
		color: #fff;
	}

	.btn-edit:hover {
		background-color: #3a3a3a;
	}

	.btn-delete {
		background-color: transparent;
		color: #ff4757;
		border: 1px solid #ff4757;
	}

	.btn-delete:hover {
		background-color: #ff4757;
		color: #fff;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background-color: #0d0d0d;
		border-radius: 12px;
		border: 1px solid #2a2a2a;
		width: 450px;
		max-width: 90%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid #1a1a1a;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 18px;
		color: #fff;
	}

	.modal-close {
		background: none;
		border: none;
		color: #888;
		font-size: 28px;
		cursor: pointer;
		line-height: 1;
	}

	.modal-close:hover {
		color: #fff;
	}

	.modal-body {
		padding: 24px;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		color: #aaa;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 8px;
	}

	.form-group input[type="text"] {
		width: 100%;
		padding: 12px 14px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 6px;
		color: #fff;
		font-size: 14px;
	}

	.form-group input[type="text"]:focus {
		outline: none;
		border-color: #FF1744;
	}

	.role-checkboxes {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.role-checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: #1a1a1a;
		padding: 8px 14px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.role-checkbox:hover {
		background-color: #2a2a2a;
	}

	.role-checkbox input {
		accent-color: #FF1744;
	}

	.role-checkbox span {
		color: #ddd;
		font-size: 13px;
	}

	.image-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.image-preview {
		width: 120px;
		height: 120px;
		border-radius: 8px;
		object-fit: cover;
		background-color: #1a1a1a;
	}

	.image-placeholder {
		width: 120px;
		height: 120px;
		border-radius: 8px;
		background-color: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 13px;
	}

	.file-input {
		display: none;
	}

	.file-label {
		background-color: #2a2a2a;
		color: #fff;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.file-label:hover {
		background-color: #3a3a3a;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px;
		border-top: 1px solid #1a1a1a;
	}

	.btn-cancel, .btn-save {
		padding: 10px 24px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-cancel {
		background-color: transparent;
		border: 1px solid #3a3a3a;
		color: #aaa;
	}

	.btn-cancel:hover {
		background-color: #1a1a1a;
		color: #fff;
	}

	.btn-save {
		background-color: #FF1744;
		border: none;
		color: #fff;
	}

	.btn-save:hover {
		background-color: #ff3d5a;
	}
</style>
