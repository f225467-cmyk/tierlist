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
	<title>Başarılı Öğrenciler - Albatros LoL Koçluk</title>
	<meta name="description" content="Albatros LoL koçluk ile rank atlayan öğrenciler. Gold'dan Diamond'a, Silver'dan Platinum'a yükselen oyuncuların başarı hikayeleri." />
	<meta property="og:title" content="Başarılı Öğrenciler - Albatros LoL Koçluk" />
	<meta property="og:description" content="Profesyonel koçluk ile rank atlayan öğrencilerin başarı hikayeleri. LoL koçluk gerçekten işe yarıyor." />
</svelte:head>

<svelte:window bind:scrollY />

<div class="landing">
	<nav class="navbar" class:scrolled={scrollY > 50}>
		<div class="nav-container">
			<a href="/" class="nav-brand">
				<img src="/ivern.jpg" alt="Albatros" class="nav-logo" />
				<span class="nav-brand-text">ALBATROS</span>
			</a>
			<div class="nav-links">
				<a href="/" class="nav-link">Hakkında</a>
				<a href="/kocluk-turleri" class="nav-link">Koçluk Türleri</a>
				<a href="/basarili-ogrenciler" class="nav-link active">Başarılı Öğrenciler</a>
				<a href="/tierlist" class="nav-link">Tier List</a>
				<a href="/drafting" class="nav-link">Draft</a>
			</div>
			<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" class="nav-cta">
				Instagram'dan Ulaş
			</a>
		</div>
	</nav>

	<section class="section">
		<div class="container">
			<h2 class="section-title fade-in">Başarılı Öğrenciler</h2>
			<div class="students-grid fade-in">
				<div class="student-card">
					<div class="student-name">Oyuncu 1</div>
					<div class="rank-progress">
						<span class="rank rank-before">Gold IV</span>
						<span class="rank-arrow">&rarr;</span>
						<span class="rank rank-after">Diamond II</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 2</div>
					<div class="rank-progress">
						<span class="rank rank-before">Silver I</span>
						<span class="rank-arrow">&rarr;</span>
						<span class="rank rank-after">Platinum I</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 3</div>
					<div class="rank-progress">
						<span class="rank rank-before">Platinum III</span>
						<span class="rank-arrow">&rarr;</span>
						<span class="rank rank-after">Master</span>
					</div>
				</div>
				<div class="student-card">
					<div class="student-name">Oyuncu 4</div>
					<div class="rank-progress">
						<span class="rank rank-before">Gold II</span>
						<span class="rank-arrow">&rarr;</span>
						<span class="rank rank-after">Emerald I</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<footer class="footer">
		<div class="container">
			<div class="footer-cta fade-in">
				<h2>Hemen Koçluk Almaya Başla</h2>
				<p>Instagram'dan bize ulaş, koçluk hakkında bilgi al.</p>
				<a href="https://www.instagram.com/albatrosotuz5" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large">
					Instagram'a Git
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

	.section {
		padding: 120px 0 100px;
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

	.rank { font-size: 14px; font-weight: 600; }
	.rank-before { color: #888; }
	.rank-arrow { color: #FF1744; font-size: 18px; }
	.rank-after { color: #FF1744; }

	.footer {
		background: #0a0a0a;
		padding: 80px 0 40px;
		text-align: center;
		border-top: 1px solid #1a1a1a;
	}

	.footer-cta { margin-bottom: 32px; }
	.footer-cta h2 { font-size: 36px; font-weight: 800; margin: 0 0 16px; }
	.footer-cta p { color: #888; font-size: 16px; margin: 0 0 32px; }

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

	.btn-primary { background: #FF1744; color: #fff; }
	.btn-primary:hover { background: #e01440; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255, 23, 68, 0.3); }
	.btn-large { padding: 18px 48px; font-size: 18px; }

	.copyright { color: #444; font-size: 14px; margin: 0; }

	.fade-in {
		opacity: 0;
		transform: translateY(24px);
		transition: opacity 0.6s ease, transform 0.6s ease;
	}

	.fade-in.visible {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 900px) {
		.students-grid { grid-template-columns: repeat(2, 1fr); }
		.nav-links { display: none; }
	}

	@media (max-width: 600px) {
		.students-grid { grid-template-columns: 1fr; }
		.section-title { font-size: 28px; margin-bottom: 40px; }
		.section { padding: 100px 0 60px; }
		.footer-cta h2 { font-size: 24px; }
		.nav-cta { padding: 8px 14px; font-size: 13px; }
	}
</style>
