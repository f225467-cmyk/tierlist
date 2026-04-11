<script>
	import { page } from '$app/stores';
	import { language, translations } from '$lib/stores.js';

	let currentPage = 'tierlist';
	let selectedLanguage = 'EN';

	$: isFullscreen = $page.url.pathname === '/'
		|| $page.url.pathname.startsWith('/admin')
		|| $page.url.pathname.startsWith('/kocluk-turleri')
		|| $page.url.pathname.startsWith('/basarili-ogrenciler');

	$: {
		if ($page.url.pathname.includes('admin')) {
			currentPage = 'admin';
		} else if ($page.url.pathname.includes('drafting')) {
			currentPage = 'drafting';
		} else {
			currentPage = 'tierlist';
		}
	}
	$: t = translations[selectedLanguage];

	function setLanguage(lang) {
		selectedLanguage = lang;
		language.set(lang);
	}
</script>

<div class="app" class:fullscreen={isFullscreen}>
	{#if !isFullscreen}
		<aside class="sidebar">
			<div class="sidebar-top">
				<div class="logo">
					<a href="/">
						<img src="/ivern.jpg" alt="Logo" />
					</a>
				</div>
				<nav>
					<a href="/tierlist" class="nav-item" class:active={currentPage === 'tierlist'}>
						{t.tierLists}
					</a>
					<a href="/drafting" class="nav-item" class:active={currentPage === 'drafting'}>
						{t.drafting}
					</a>
				</nav>
			</div>

			<div class="sidebar-bottom">
				<a href="/" class="coach-link">
					{t.needCoach}
				</a>

				<div class="social-icons">
					<a href="https://kick.com/albatros35" target="_blank" rel="noopener noreferrer" class="social-icon" title="Kick">
						<img src="/Kick.png" alt="Kick" class="social-logo" />
					</a>
					<a href="https://www.youtube.com/@Albatroos35" target="_blank" rel="noopener noreferrer" class="social-icon" title="YouTube">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
					</a>
					<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" class="social-icon" title="Instagram">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
						</svg>
					</a>
					<a href="https://x.com/Albatrosotuzbes" target="_blank" rel="noopener noreferrer" class="social-icon" title="X">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
						</svg>
					</a>
				</div>

				<div class="language-selector">
					<button
						class="lang-btn"
						class:active={selectedLanguage === 'EN'}
						on:click={() => setLanguage('EN')}
					>
						EN
					</button>
					<button
						class="lang-btn"
						class:active={selectedLanguage === 'KR'}
						on:click={() => setLanguage('KR')}
					>
						KR
					</button>
					<button
						class="lang-btn"
						class:active={selectedLanguage === 'TR'}
						on:click={() => setLanguage('TR')}
					>
						TR
					</button>
				</div>
			</div>
		</aside>
	{/if}

	<main class="main-content" class:fullscreen={isFullscreen}>
		<slot />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background-color: #000000;
		color: #fff;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		display: flex;
		height: 100vh;
		width: 100vw;
	}

	.app:not(.fullscreen) :global(body) {
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		overflow: hidden;
		background-color: #000000;
	}

	.main-content.fullscreen {
		overflow: auto;
	}

	.sidebar {
		width: 180px;
		background-color: #0a0a0a;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 20px 0;
		border-right: 1px solid #1a1a1a;
	}

	.sidebar-top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	.logo {
		width: 80px;
		height: 80px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: none;
		transition: all 0.3s ease;
		margin: 0 auto 30px auto;
	}

	.logo:hover {
		transform: scale(1.05);
	}

	.logo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0;
		width: 100%;
	}

	.nav-item {
		color: #ddd;
		text-decoration: none;
		font-size: 15px;
		text-align: left;
		padding: 12px 20px;
		border-radius: 0;
		transition: all 0.2s;
		cursor: pointer;
		font-weight: 400;
		letter-spacing: 0;
		background-color: transparent;
		border: none;
	}

	.nav-item:hover {
		color: #fff;
		background-color: rgba(255, 255, 255, 0.05);
	}

	.nav-item.active {
		color: #0d0d0d;
		background-color: #FF1744;
		font-weight: 600;
		box-shadow: none;
	}

	.sidebar-bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.coach-link {
		color: #fff;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		padding: 0 20px;
		text-align: center;
		transition: all 0.2s;
		cursor: pointer;
		letter-spacing: 0.3px;
	}

	.coach-link:hover {
		color: #FF1744;
	}

	.language-selector {
		display: flex;
		gap: 12px;
		padding: 0 20px;
		background-color: transparent;
		border-radius: 0;
		border: none;
		width: 100%;
		justify-content: center;
	}

	.lang-btn {
		background-color: transparent;
		border: none;
		color: #666;
		padding: 0;
		font-size: 14px;
		font-weight: 600;
		border-radius: 0;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0;
	}

	.lang-btn:hover {
		color: #aaa;
	}

	.lang-btn.active {
		color: #FF1744;
	}

	.social-icons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		width: auto;
		padding: 0 20px;
	}

	.social-icon {
		color: #ddd;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 0;
		background-color: transparent;
		border: none;
	}

	.social-icon:hover {
		color: #FF1744;
	}

	.social-icon svg {
		width: 20px;
		height: 20px;
	}

	.social-logo {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}
</style>
