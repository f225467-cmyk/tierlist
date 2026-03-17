<script>
	import { onMount } from 'svelte';

	let scrollY = 0;
	let sections = {};

	function scrollTo(id) {
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth' });
	}

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
				<button on:click={() => scrollTo('hakkimda')}>Hakkımda</button>
				<button on:click={() => scrollTo('kocluk')}>Koçluk</button>
				<a href="/tierlist" class="nav-link">Tier List</a>
				<a href="/drafting" class="nav-link">Draft</a>
				<button on:click={() => scrollTo('iletisim')}>İletişim</button>
			</div>
			<a href="https://discord.gg/lol-kocluk" target="_blank" rel="noopener noreferrer" class="nav-cta">
				Discord'dan Ulaş
			</a>
		</div>
	</nav>

	<!-- Hero -->
	<section class="hero">
		<div class="hero-bg">
			<img src="/leagueoflegendsmap.png" alt="" class="hero-bg-img" />
			<div class="hero-overlay"></div>
		</div>
		<div class="hero-content fade-in">
			<h1>Profesyonel LoL Koçluk</h1>
			<p class="hero-sub">Rekabetçi League of Legends'ta bir adım öne geç. Kişisel koçluk ile rank atla, oyununu geliştir.</p>
			<div class="hero-buttons">
				<a href="https://discord.gg/lol-kocluk" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Koçluk Al</a>
				<a href="/tierlist" class="btn btn-secondary">Araçları Keşfet</a>
			</div>
		</div>
	</section>

	<!-- Hakkımda -->
	<section id="hakkimda" class="section">
		<div class="container">
			<h2 class="section-title fade-in">Hakkımda</h2>
			<div class="about-grid fade-in">
				<div class="about-photo">
					<div class="photo-placeholder">
						<img src="/ivern.jpg" alt="Albatros" class="about-img" />
					</div>
				</div>
				<div class="about-info">
					<h3>Albatros</h3>
					<p class="about-desc">Profesyonel League of Legends koçu ve analist. Türkiye'nin en iyi takımlarında görev aldım.</p>
					<ul class="career-list">
						<li>
							<span class="career-year">2022 Kış</span>
							<span class="career-role">Papara SuperMassive Ana Takım Analist</span>
						</li>
						<li>
							<span class="career-year">2022 Yaz</span>
							<span class="career-role">Nasr E Sport Akademi</span>
						</li>
						<li>
							<span class="career-year">2023</span>
							<span class="career-role">Türkiye Yaz 2.Lig Şampiyonu AWH Asistan Koç</span>
						</li>
					</ul>
				</div>
			</div>
			<div class="video-section fade-in">
				<iframe
					width="100%"
					height="400"
					src="https://www.youtube.com/embed/dQw4w9WgXcQ"
					title="Albatros YouTube"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			</div>
		</div>
	</section>

	<!-- Koçluk Size Ne Katar -->
	<section id="kocluk" class="section section-alt">
		<div class="container">
			<h2 class="section-title fade-in">Koçluk Size Ne Katar?</h2>
			<div class="cards-grid fade-in">
				<div class="card">
					<div class="card-icon">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
						</svg>
					</div>
					<h3>Rün Bilgisi</h3>
					<p>Doğru rün seçimi ve optimizasyon. Her şampiyon ve eşleşme için en uygun rün sayfalarını öğren.</p>
				</div>
				<div class="card">
					<div class="card-icon">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
							<line x1="7" y1="7" x2="7.01" y2="7"/>
						</svg>
					</div>
					<h3>Eşya Bilgisi</h3>
					<p>Duruma göre eşya tercihi. Oyunun gidişatına göre doğru build path'i seçmeyi öğren.</p>
				</div>
				<div class="card">
					<div class="card-icon">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
						</svg>
					</div>
					<h3>Makro Oyun</h3>
					<p>Harita kontrolü ve karar alma. Objektif önceliklendirme, dalga yönetimi ve rotasyon bilgisi.</p>
				</div>
				<div class="card">
					<div class="card-icon">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
						</svg>
					</div>
					<h3>Mikro Oyun</h3>
					<p>Mekanik geliştirme ve lane kontrolü. Combo'lar, trading pattern'leri ve team fight pozisyonlama.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Araçlar -->
	<section id="araclar" class="section">
		<div class="container">
			<h2 class="section-title fade-in">Araçlar</h2>
			<div class="tools-grid fade-in">
				<a href="/tierlist" class="tool-card">
					<div class="tool-icon">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<line x1="8" y1="6" x2="21" y2="6"/>
							<line x1="8" y1="12" x2="21" y2="12"/>
							<line x1="8" y1="18" x2="21" y2="18"/>
							<line x1="3" y1="6" x2="3.01" y2="6"/>
							<line x1="3" y1="12" x2="3.01" y2="12"/>
							<line x1="3" y1="18" x2="3.01" y2="18"/>
						</svg>
					</div>
					<h3>Tier List</h3>
					<p>Güncel meta tier list'i. Şampiyonları rollerine ve güçlerine göre sırala.</p>
				</a>
				<a href="/drafting" class="tool-card">
					<div class="tool-icon">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF1744" stroke-width="2">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 00-3-3.87"/>
							<path d="M16 3.13a4 4 0 010 7.75"/>
						</svg>
					</div>
					<h3>Draft Simülatör</h3>
					<p>Takım kompozisyonu oluştur, ban/pick stratejilerini pratik et.</p>
				</a>
			</div>
		</div>
	</section>

	<!-- Başarılı Öğrenciler -->
	<section class="section section-alt">
		<div class="container">
			<h2 class="section-title fade-in">Başarılı Öğrenciler</h2>
			<div class="students-grid fade-in">
				<div class="student-card">
					<div class="student-name">Oyuncu 1</div>
					<div class="rank-progress">
						<span class="rank rank-before">Gold IV</span>
						<span class="rank-arrow">→</span>
						<span class="rank rank-after">Diamond II</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 2</div>
					<div class="rank-progress">
						<span class="rank rank-before">Silver I</span>
						<span class="rank-arrow">→</span>
						<span class="rank rank-after">Platinum I</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 3</div>
					<div class="rank-progress">
						<span class="rank rank-before">Platinum III</span>
						<span class="rank-arrow">→</span>
						<span class="rank rank-after">Master</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 4</div>
					<div class="rank-progress">
						<span class="rank rank-before">Gold II</span>
						<span class="rank-arrow">→</span>
						<span class="rank rank-after">Emerald I</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer id="iletisim" class="footer">
		<div class="container">
			<div class="footer-cta fade-in">
				<h2>Hemen Koçluk Almaya Başla</h2>
				<p>Discord sunucumuza katıl, koçluk hakkında bilgi al.</p>
				<a href="https://discord.gg/lol-kocluk" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large">
					Discord'a Katıl
				</a>
			</div>

			<div class="footer-socials fade-in">
				<a href="https://www.youtube.com/@Albatroos35" target="_blank" rel="noopener noreferrer" title="YouTube">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
					</svg>
				</a>
				<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" title="Instagram">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
					</svg>
				</a>
				<a href="https://www.tiktok.com/@albatrosotuz5" target="_blank" rel="noopener noreferrer" title="TikTok">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.19-4.63z"/>
					</svg>
				</a>
				<a href="https://x.com/Albatrosotuzbes" target="_blank" rel="noopener noreferrer" title="X">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
					</svg>
				</a>
				<a href="https://kick.com/albatros35" target="_blank" rel="noopener noreferrer" title="Kick">
					<img src="/Kick.png" alt="Kick" class="footer-kick-logo" />
				</a>
			</div>

			<p class="copyright">&copy; 2026 Albatros LoL Koçluk</p>
		</div>
	</footer>
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
		background: transparent;
	}

	.navbar.scrolled {
		background: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(10px);
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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

	.nav-links button {
		background: none;
		border: none;
		color: #ccc;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		padding: 8px 16px;
		border-radius: 6px;
		transition: all 0.2s;
		font-family: 'Inter', sans-serif;
	}

	.nav-links button:hover,
	.nav-links .nav-link:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
	}

	.nav-links .nav-link {
		color: #FF1744;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 6px;
		transition: all 0.2s;
		font-family: 'Inter', sans-serif;
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
		opacity: 0.15;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(10, 10, 10, 0.6) 0%, rgba(10, 10, 10, 0.95) 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		max-width: 700px;
		padding: 0 24px;
	}

	.hero-content h1 {
		font-size: 64px;
		font-weight: 900;
		margin: 0 0 20px;
		line-height: 1.1;
		background: linear-gradient(135deg, #fff 0%, #ccc 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-sub {
		font-size: 18px;
		color: #aaa;
		margin: 0 0 40px;
		line-height: 1.6;
	}

	.hero-buttons {
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 14px 32px;
		border-radius: 10px;
		font-size: 16px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
		border: none;
		font-family: 'Inter', sans-serif;
	}

	.btn-primary {
		background: #FF1744;
		color: #fff;
	}

	.btn-primary:hover {
		background: #e01440;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(255, 23, 68, 0.3);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
	}

	.btn-large {
		padding: 18px 48px;
		font-size: 18px;
	}

	/* Sections */
	.section {
		padding: 100px 0;
	}

	.section-alt {
		background: #0a0a0a;
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.section-title {
		font-size: 40px;
		font-weight: 800;
		text-align: center;
		margin: 0 0 60px;
	}

	/* About */
	.about-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 60px;
		align-items: start;
		margin-bottom: 60px;
	}

	.about-photo {
		display: flex;
		justify-content: center;
	}

	.photo-placeholder {
		width: 240px;
		height: 240px;
		border-radius: 16px;
		overflow: hidden;
		border: 2px solid #1a1a1a;
	}

	.about-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.about-info h3 {
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 12px;
	}

	.about-desc {
		color: #aaa;
		font-size: 16px;
		line-height: 1.6;
		margin: 0 0 24px;
	}

	.career-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.career-list li {
		display: flex;
		gap: 16px;
		align-items: baseline;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border-left: 3px solid #FF1744;
	}

	.career-year {
		color: #FF1744;
		font-weight: 700;
		font-size: 14px;
		white-space: nowrap;
		min-width: 80px;
	}

	.career-role {
		color: #ddd;
		font-size: 15px;
	}

	.video-section {
		max-width: 800px;
		margin: 0 auto;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid #1a1a1a;
	}

	.video-section iframe {
		display: block;
	}

	/* Cards */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24px;
	}

	.card {
		background: #111;
		border: 1px solid #1a1a1a;
		border-radius: 16px;
		padding: 32px 24px;
		text-align: center;
		transition: all 0.3s ease;
	}

	.card:hover {
		border-color: #FF1744;
		transform: translateY(-4px);
		box-shadow: 0 8px 32px rgba(255, 23, 68, 0.1);
	}

	.card-icon {
		margin-bottom: 20px;
	}

	.card h3 {
		font-size: 18px;
		font-weight: 700;
		margin: 0 0 12px;
	}

	.card p {
		color: #888;
		font-size: 14px;
		line-height: 1.6;
		margin: 0;
	}

	/* Tools */
	.tools-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}

	.tool-card {
		background: #111;
		border: 1px solid #1a1a1a;
		border-radius: 16px;
		padding: 48px 32px;
		text-align: center;
		text-decoration: none;
		color: #fff;
		transition: all 0.3s ease;
	}

	.tool-card:hover {
		border-color: #FF1744;
		transform: translateY(-4px);
		box-shadow: 0 8px 32px rgba(255, 23, 68, 0.1);
	}

	.tool-icon {
		margin-bottom: 24px;
	}

	.tool-card h3 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 12px;
	}

	.tool-card p {
		color: #888;
		font-size: 15px;
		line-height: 1.6;
		margin: 0;
	}

	/* Students */
	.students-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
	}

	.student-card {
		background: #111;
		border: 1px solid #1a1a1a;
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		transition: all 0.3s ease;
	}

	.student-card:hover {
		border-color: rgba(255, 23, 68, 0.3);
	}

	.student-name {
		font-weight: 600;
		margin-bottom: 16px;
		font-size: 16px;
	}

	.rank-progress {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.rank {
		font-size: 14px;
		font-weight: 600;
	}

	.rank-before {
		color: #888;
	}

	.rank-arrow {
		color: #FF1744;
		font-size: 18px;
	}

	.rank-after {
		color: #FF1744;
	}

	/* Footer */
	.footer {
		background: #0a0a0a;
		padding: 80px 0 40px;
		text-align: center;
		border-top: 1px solid #1a1a1a;
	}

	.footer-cta {
		margin-bottom: 60px;
	}

	.footer-cta h2 {
		font-size: 36px;
		font-weight: 800;
		margin: 0 0 16px;
	}

	.footer-cta p {
		color: #888;
		font-size: 16px;
		margin: 0 0 32px;
	}

	.footer-socials {
		display: flex;
		justify-content: center;
		gap: 20px;
		margin-bottom: 32px;
	}

	.footer-socials a {
		color: #666;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.04);
	}

	.footer-socials a:hover {
		color: #FF1744;
		background: rgba(255, 23, 68, 0.1);
	}

	.footer-kick-logo {
		width: 24px;
		height: 24px;
		object-fit: contain;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.footer-socials a:hover .footer-kick-logo {
		opacity: 1;
	}

	.copyright {
		color: #444;
		font-size: 14px;
		margin: 0;
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

	/* Make hero fade-in visible immediately */
	.hero .fade-in {
		opacity: 1;
		transform: translateY(0);
		animation: heroFadeIn 0.8s ease;
	}

	@keyframes heroFadeIn {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive */
	@media (max-width: 900px) {
		.hero-content h1 {
			font-size: 40px;
		}

		.cards-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.students-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.about-grid {
			grid-template-columns: 1fr;
			gap: 40px;
			text-align: center;
		}

		.career-list li {
			flex-direction: column;
			gap: 4px;
			text-align: left;
		}

		.nav-links {
			display: none;
		}
	}

	@media (max-width: 600px) {
		.hero-content h1 {
			font-size: 32px;
		}

		.hero-sub {
			font-size: 16px;
		}

		.section {
			padding: 60px 0;
		}

		.section-title {
			font-size: 28px;
			margin-bottom: 40px;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.tools-grid {
			grid-template-columns: 1fr;
		}

		.students-grid {
			grid-template-columns: 1fr;
		}

		.footer-cta h2 {
			font-size: 24px;
		}

		.nav-cta {
			padding: 8px 14px;
			font-size: 13px;
		}
	}
</style>
