<script>
	import { onMount } from 'svelte';

	let scrollY = 0;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1 }
		);
		document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Albatros LoL Koçluk - Profesyonel League of Legends Koçu</title>
	<meta name="description" content="Albatros Metin Değirmenci ile profesyonel LoL koçluk. Papara SuperMassive analist, AWH şampiyonluk koçu. Canlı koçluk, VOD analiz ve 1v1 eğitim ile oyun seviyeni yükselt." />
	<meta property="og:title" content="Albatros LoL Koçluk - Profesyonel League of Legends Koçu" />
	<meta property="og:description" content="Profesyonel analist Albatros Metin Değirmenci ile bireysel LoL koçluk. Rün, eşya, makro ve mikro oyun eğitimi." />
	<meta property="og:url" content="/" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "ProfessionalService",
		"name": "Albatros LoL Koçluk",
		"description": "League of Legends profesyonel bireysel koçluk hizmeti. Canlı koçluk, VOD analiz ve 1v1 eğitim.",
		"founder": {
			"@type": "Person",
			"name": "Albatros Metin Değirmenci",
			"jobTitle": "League of Legends Koç ve Analist",
			"description": "2020'den beri bireysel koçluk. Papara SuperMassive Analist, NASR Esports Akademi, Always With Honor Şampiyonluk Asistan Koçu.",
			"sameAs": [
				"https://www.instagram.com/albatrosotuz5",
				"https://www.youtube.com/@Albatroos35",
				"https://kick.com/albatros35",
				"https://www.tiktok.com/@albatrosotuz5",
				"https://x.com/Albatrosotuzbes"
			]
		},
		"serviceType": "Esports Koçluk",
		"areaServed": "TR",
		"inLanguage": "tr"
	})}</script>`}
</svelte:head>

<svelte:window bind:scrollY />

<div class="landing">
	<!-- Navbar -->
	<nav class="navbar" class:scrolled={scrollY > 50}>
		<div class="nav-container">
			<a href="/" class="nav-brand">
				<img src="/ivern.jpg" alt="Albatros" class="nav-logo" />
				<span class="nav-brand-text">ALBATROS</span>
			</a>
			<div class="nav-links">
				<a href="/" class="nav-link active">Hakkında</a>
				<a href="/kocluk-turleri" class="nav-link">Koçluk Türleri</a>
				<a href="/basarili-ogrenciler" class="nav-link">Başarılı Öğrenciler</a>
				<a href="/tierlist" class="nav-link">Tier List</a>
				<a href="/drafting" class="nav-link">Draft</a>
			</div>
			<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" class="nav-cta">
				Instagram'dan Ulaş
			</a>
		</div>
	</nav>

	<!-- Hakkında -->
	<section id="hakkinda" class="hero">
		<div class="hero-bg">
			<img src="/hakkinda-bg.jpg" alt="League of Legends koçluk" class="hero-bg-img" />
			<div class="hero-overlay"></div>
		</div>
		<div class="hero-content fade-in">
			<div class="hakkinda-layout">
				<div class="hakkinda-photo">
					<img src="/AlbatrosChess.png" alt="Albatros Metin Değirmenci - League of Legends Profesyonel Koç ve Analist" class="hakkinda-img" />
				</div>
				<div class="hakkinda-text">
					<div class="hakkinda-section">
						<h1 class="hakkinda-label">KARİYER</h1>
						<p class="hakkinda-name">Ben <strong>Albatros Metin Değirmenci.</strong></p>
						<p class="hakkinda-desc">2020 yılında bireysel koçluk kariyerime başladım ve sonrasında farklı takımlarda çeşitli görevler üstlendim. League of Legends'da oyun temelleri ve teorik bilgiler üzerine aktif olarak çalışmaktayım.</p>
						<p class="hakkinda-desc">Her öğrencinin özel olduğuna inanıyor, her koçluk sürecini derinlerine inmemiz gereken uçsuz bucaksız bir yolculuk olarak görüyorum.</p>
					</div>
					<div class="hakkinda-section">
						<h2 class="hakkinda-label">TAKIMLAR</h2>
						<ul class="takimlar-list">
							<li>
								<span class="takim-year">2022 Kış</span>
								<span class="takim-info">Papara SuperMassive Ana Takım – Analist</span>
							</li>
							<li>
								<span class="takim-year">2022 Yaz</span>
								<span class="takim-info">NASR Esports Akademi</span>
							</li>
							<li>
								<span class="takim-year">2023 Yaz</span>
								<span class="takim-info">Always With Honor – Şampiyonluk, Asistan Koç</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div class="hakkinda-socials">
			<a href="https://kick.com/albatros35" target="_blank" rel="noopener noreferrer" title="Kick">
				<img src="/Kick.png" alt="Kick" class="hakkinda-kick-logo" />
			</a>
			<a href="https://www.youtube.com/@Albatroos35" target="_blank" rel="noopener noreferrer" title="YouTube">
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
					<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
				</svg>
			</a>
			<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" title="Instagram">
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
				</svg>
			</a>
			<a href="https://www.tiktok.com/@albatrosotuz5" target="_blank" rel="noopener noreferrer" title="TikTok">
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.19-4.63z"/>
				</svg>
			</a>
			<a href="https://x.com/Albatrosotuzbes" target="_blank" rel="noopener noreferrer" title="X">
				<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
				</svg>
			</a>
		</div>
	</section>
</div>

<style>
	.landing {
		width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		height: 100vh;
	}

	/* Navbar */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 16px 0;
		transition: all 0.3s ease;
		background: #000;
	}

	.navbar.scrolled {
		background: #000;
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: #fff;
	}

	.nav-logo {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		object-fit: cover;
	}

	.nav-brand-text {
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 2px;
	}

	.nav-links {
		display: flex;
		gap: 8px;
	}

	.nav-links .nav-link {
		color: #fff;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		padding: 8px 16px;
		border-radius: 6px;
		transition: all 0.2s;
		font-family: 'Inter', sans-serif;
	}

	.nav-links .nav-link:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.nav-links .nav-link.active {
		background: rgba(255, 23, 68, 0.15);
		color: #FF1744;
		font-weight: 600;
	}

	.nav-cta {
		background: #FF1744;
		color: #fff;
		padding: 10px 20px;
		border-radius: 8px;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.nav-cta:hover {
		background: #e01440;
		transform: translateY(-1px);
	}

	/* Hero */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
	}

	.hero-bg-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.55;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.6) 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		width: 100%;
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.hakkinda-layout {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		max-width: 1050px;
		margin: 0 auto;
	}

	.hakkinda-photo {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.hakkinda-img {
		width: 420px;
		height: auto;
		border-radius: 16px;
		object-fit: cover;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
	}

	.hakkinda-text {
		display: flex;
		flex-direction: column;
		gap: 36px;
		padding-left: 64px;
		max-width: 600px;
	}

	.hakkinda-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.hakkinda-label {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 3px;
		color: #FF1744;
		margin: 0;
		text-transform: uppercase;
	}

	.hakkinda-name {
		font-size: 24px;
		color: #fff;
		margin: 0;
		line-height: 1.5;
	}

	.hakkinda-desc {
		font-size: 17px;
		color: rgba(255, 255, 255, 0.85);
		margin: 0;
		line-height: 1.7;
	}

	.takimlar-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.takimlar-list li {
		display: flex;
		align-items: baseline;
		gap: 16px;
		padding: 14px 18px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border-left: 2px solid #FF1744;
	}

	.takim-year {
		color: #FF1744;
		font-weight: 700;
		font-size: 15px;
		white-space: nowrap;
		min-width: 80px;
	}

	.takim-info {
		color: rgba(255, 255, 255, 0.95);
		font-size: 16px;
	}

	.hakkinda-socials {
		display: flex;
		justify-content: center;
		gap: 20px;
		padding: 28px 0 40px;
		z-index: 2;
	}

	.hakkinda-socials a {
		color: #888;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.06);
		transition: all 0.2s;
	}

	.hakkinda-socials a:hover {
		color: #FF1744;
		background: rgba(255, 23, 68, 0.12);
	}

	.hakkinda-kick-logo {
		width: 26px;
		height: 26px;
		object-fit: contain;
		opacity: 0.55;
		transition: opacity 0.2s;
	}

	.hakkinda-socials a:hover .hakkinda-kick-logo {
		opacity: 1;
	}

	/* Animations */
	.fade-in {
		opacity: 0;
		transform: translateY(24px);
		transition: opacity 0.6s ease, transform 0.6s ease;
	}

	.fade-in.visible, .hero .fade-in {
		opacity: 1;
		transform: translateY(0);
	}

	.hero .fade-in {
		opacity: 1;
		transform: translateY(0);
		animation: heroFadeIn 0.8s ease;
	}

	@keyframes heroFadeIn {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Responsive */
	@media (max-width: 900px) {
		.nav-links {
			display: none;
		}

		.hakkinda-layout {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding-left: 20px;
			padding-right: 20px;
		}

		.hakkinda-text {
			padding-left: 0;
		}

		.hakkinda-img {
			width: 260px;
			margin-bottom: 24px;
		}

		.takimlar-list li {
			flex-direction: column;
			gap: 4px;
		}
	}

	@media (max-width: 600px) {
		.nav-cta {
			padding: 8px 14px;
			font-size: 13px;
		}
	}
</style>
