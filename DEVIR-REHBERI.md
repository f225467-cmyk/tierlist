# PROJE DEVİR REHBERİ - Tier List Uygulaması

Bu rehber, projeyi yeni sahibine devretmek için adım adım yapılması gerekenleri anlatır.

---

## GENEL BAKIŞ

Bu proje 3 servisten oluşuyor:
- **Client** (SvelteKit) → Kullanıcının gördüğü site
- **Server** (Express.js) → API backend
- **Veritabanı** (PostgreSQL) → Neon.tech üzerinde ücretsiz

Hosting: Railway (ücretsiz plan)
Domain: Müşterinin kendi domaini bağlanacak

---

## ADIM 1: GITHUB HESABI

Müşterinin GitHub hesabı olmalı. Yoksa github.com'dan açılacak.

1. github.com → Sign Up → hesap aç
2. Yeni bir repository oluştur:
   - Repository name: `tierlist` (veya istediği isim)
   - Private seçilebilir
   - Create repository
3. Projeyi müşterinin GitHub'ına push'la:

```bash
cd tierlistapp
git remote remove origin
git remote add origin https://github.com/MUSTERININ-KULLANICI-ADI/tierlist.git
git push -u origin main
```

NOT: `MUSTERININ-KULLANICI-ADI` kısmını müşterinin GitHub kullanıcı adıyla değiştir.

---

## ADIM 2: NEON.TECH VERİTABANI

1. https://neon.tech adresine git
2. "Sign Up" → GitHub ile giriş yap (müşterinin GitHub hesabıyla)
3. "Create a project" butonuna tıkla
   - Project name: `tierlist` (veya istediği isim)
   - Region: Müşteriye en yakın bölge
   - "Create project" tıkla
4. Açılan sayfada **Connection string** gösterilecek, şuna benzer:

```
postgresql://neondb_owner:SIFRE@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

5. **Bu connection string'i kopyala ve bir yere kaydet** → Bu `DATABASE_URL` olacak

---

## ADIM 3: RAILWAY HESABI

1. https://railway.com adresine git
2. "Login" → GitHub ile giriş yap (müşterinin GitHub hesabıyla)
3. "New Project" tıkla → "Deploy from GitHub repo" seç
4. Müşterinin GitHub'ındaki `tierlist` reposunu seç
5. Railway otomatik olarak bir servis oluşturacak

### 3a. Server Servisi Oluşturma

İlk servis otomatik oluştu. Bunu Server olarak ayarla:

1. Servise tıkla → **Settings** sekmesi
2. **Root Directory** kısmına yaz: `server`
3. **Custom Start Command** kısmına yaz: `npm start`
4. Kaydet

Sonra **Variables** sekmesine geç, şu değişkenleri ekle:

| Variable | Değer |
|----------|-------|
| `DATABASE_URL` | Neon'dan aldığın connection string |
| `JWT_SECRET` | Rastgele uzun bir şifre (örn: `benim-gizli-anahtarim-2026-xyz`) |
| `ADMIN_PASSWORD_HASH` | Aşağıdaki "Şifre Oluşturma" bölümüne bak |
| `CORS_ORIGIN` | Client servisinin URL'si (Adım 3b'den sonra eklenecek) |

### 3b. Client Servisi Oluşturma

1. Railway dashboard'da "New" → "Service" → aynı GitHub reposunu seç
2. Yeni servis oluşacak. Tıkla → **Settings** sekmesi
3. **Root Directory** kısmına yaz: `client`
4. **Custom Start Command** kısmına yaz: `npm start`
5. Kaydet

Sonra **Variables** sekmesine geç, şu değişkenleri ekle:

| Variable | Değer |
|----------|-------|
| `VITE_API_URL` | Server servisinin Railway URL'si + `/api` |
| `VITE_API_BASE_URL` | Server servisinin Railway URL'si |

**Server URL'sini bulmak için:** Server servisine tıkla → Settings → Networking → "Generate Domain" tıkla → `.up.railway.app` ile biten URL'yi kopyala.

Örnek:
- `VITE_API_URL` = `https://tierlist-production-xxxx.up.railway.app/api`
- `VITE_API_BASE_URL` = `https://tierlist-production-xxxx.up.railway.app`

### 3c. CORS_ORIGIN Ayarı

Client servisi de bir URL alacak (Settings → Networking → Generate Domain).

Server servisinin Variables'ına geri dön ve `CORS_ORIGIN` değerini client'ın URL'si olarak ayarla.

Örnek: `CORS_ORIGIN` = `https://tierlist-client-xxxx.up.railway.app`

---

## ADIM 4: DOMAIN BAĞLAMA (Opsiyonel)

Müşterinin kendi domaini varsa (örn: `www.example.com`):

1. Railway'de **Client** servisine git → Settings → Networking
2. "Custom Domain" → domaini yaz (örn: `www.example.com`)
3. Railway sana bir CNAME kaydı verecek
4. Müşterinin domain sağlayıcısına git (GoDaddy, Namecheap, Cloudflare vs.)
5. DNS ayarlarına CNAME kaydı ekle:
   - Name: `www` (veya `@`)
   - Value: Railway'in verdiği CNAME değeri
6. DNS yayılması 5-30 dakika sürebilir

**ÖNEMLİ:** Domain bağladıktan sonra Server'daki `CORS_ORIGIN` değerini güncelle!
Örnek: `CORS_ORIGIN` = `https://www.example.com`

---

## ADIM 5: ADMİN ŞİFRESİ OLUŞTURMA

Admin paneli şifre ile korunuyor. Şifre hash'lenmiş olarak saklanır.

### Yeni şifre oluşturmak için:

1. Bilgisayarda terminali aç
2. Proje klasörüne git: `cd tierlistapp/server`
3. Şu komutu çalıştır:

```bash
node generate-password.js BURAYA-ISTEDIGIN-SIFRE
```

4. Çıktıda bir hash göreceksin, şuna benzer:
```
$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. Bu hash'i Railway Server servisinin Variables'ında `ADMIN_PASSWORD_HASH` olarak yapıştır

### Admin paneline giriş:
- Adres: `www.site-adresi.com/admin`
- Şifre: Yukarıda belirlediğin şifre (hash değil, düz şifre)

---

## ADIM 6: İLK ÇALIŞTIRMA

Her şey ayarlandıktan sonra:

1. Railway'de her iki servisin deploy olmasını bekle (yeşil tik)
2. Site adresini aç → Sayfa açılmalı (henüz veri yok)
3. `/admin` adresine git → Şifreyle giriş yap
4. İlk girişte şampiyonlar ve itemler otomatik yüklenecek
5. Birkaç saniye bekle, sayfa yenilenince veriler gelecek
6. Artık admin panelinden ekleme/silme/düzenleme yapılabilir

---

## ÖZET - TÜM ENV DEĞİŞKENLERİ

### Server Servisi Variables:

```
DATABASE_URL=postgresql://KULLANICI:SIFRE@HOST/neondb?sslmode=require
JWT_SECRET=rastgele-uzun-bir-sifre-buraya
ADMIN_PASSWORD_HASH=$2b$10$xxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=https://www.musteri-domaini.com
```

### Client Servisi Variables:

```
VITE_API_URL=https://server-url.up.railway.app/api
VITE_API_BASE_URL=https://server-url.up.railway.app
```

---

## SIK KARŞILAŞILAN SORUNLAR

### Site açılıyor ama veri yok
→ Admin paneline giriş yap, ilk girişte otomatik yüklenir

### Admin panelinde "Giriş başarısız" hatası
→ ADMIN_PASSWORD_HASH doğru mu kontrol et. Yeni hash üret.

### Admin paneli açılıyor ama veri gelmiyor
→ Server servisinin çalıştığından emin ol (Railway'de yeşil tik)
→ VITE_API_URL doğru mu kontrol et
→ CORS_ORIGIN client'ın domain'i mi kontrol et

### Görsel yükleme çalışmıyor
→ Dosya 5MB'dan küçük olmalı
→ Sadece JPEG, PNG, GIF, WebP kabul edilir

### Deploy sonrası site çalışmıyor
→ Railway'de deploy loglarını kontrol et (servise tıkla → Deployments)
→ Hata varsa logdan oku

---

## DOSYA YAPISI

```
tierlistapp/
├── client/          → Frontend (SvelteKit) - www.site.com
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte        → Ana sayfa
│   │   │   ├── tierlist/            → Tier list sayfası
│   │   │   ├── drafting/            → Draft simulator
│   │   │   └── admin/+page.svelte   → Admin paneli
│   │   └── lib/
│   │       ├── stores.js            → API bağlantıları
│   │       ├── champions.js         → Varsayılan şampiyon listesi
│   │       └── items.js             → Varsayılan item listesi
│   └── static/                      → Statik dosyalar (görseller)
│
├── server/          → Backend (Express.js) - API
│   ├── index.js     → Ana sunucu dosyası
│   ├── package.json → Bağımlılıklar
│   └── generate-password.js → Şifre hash üretici
│
└── .gitignore       → Git'e dahil edilmeyen dosyalar
```

---

## ÖNEMLİ NOTLAR

- `.env` dosyaları GitHub'a push'lanmaz (güvenlik). Tüm env ayarları Railway dashboard'dan yapılır.
- Veritabanı Neon.tech'te ücretsiz saklanır. Deploy yapılsa bile veri kaybolmaz.
- Admin panelinden yüklenen görseller veritabanında saklanır (Base64).
- Railway ücretsiz planda aylık 500 saat çalışma süresi var.
- Neon ücretsiz planda 512MB veritabanı alanı var.
