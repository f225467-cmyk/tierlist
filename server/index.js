import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
	origin: corsOrigin.split(',').map(s => s.trim()),
	credentials: true
}));
app.use(express.json());

// Rate limiting - genel API için
const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 dakika
	max: 100, // IP başına dakikada 100 istek
	message: { error: 'Too many requests, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false
});

// Yoğun işlemler için daha sıkı limit (image upload, init)
const strictLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 dakika
	max: 20, // IP başına dakikada 20 istek
	message: { error: 'Too many requests, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false
});

// Login endpoint için ayrı rate limit (5 deneme/dakika)
const loginLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 5,
	message: { error: 'Çok fazla giriş denemesi. Lütfen 1 dakika bekleyin.' },
	standardHeaders: true,
	legacyHeaders: false
});

// Tüm API route'larına rate limiting uygula
app.use('/api', apiLimiter);

// ============ AUTH ============

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: 'Authentication required' });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};

// Login endpoint
app.post('/api/auth/login', loginLimiter, (req, res) => {
	const { password } = req.body;

	if (!password) {
		return res.status(400).json({ error: 'Password is required' });
	}

	if (!ADMIN_PASSWORD_HASH) {
		return res.status(500).json({ error: 'Server auth not configured' });
	}

	const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
	if (!isValid) {
		return res.status(401).json({ error: 'Yanlış şifre' });
	}

	const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
	res.json({ token });
});

// Input sanitization - XSS koruması
const sanitizeInput = (str) => {
	if (typeof str !== 'string') return str;
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.trim()
		.slice(0, 100); // Max 100 karakter
};

// Validate name - sadece izin verilen karakterler
const isValidName = (name) => {
	if (typeof name !== 'string') return false;
	if (name.trim().length === 0 || name.length > 100) return false;
	// Alfanumerik, boşluk, tire, apostrof, nokta izin ver (şampiyon isimleri için)
	return /^[\p{L}\p{N}\s\-'.]+$/u.test(name);
};

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
const ensureDir = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

ensureDir(path.join(__dirname, 'data'));
ensureDir(path.join(__dirname, 'uploads', 'champions'));
ensureDir(path.join(__dirname, 'uploads', 'items'));

// Data file paths
const championsFile = path.join(__dirname, 'data', 'champions.json');
const itemsFile = path.join(__dirname, 'data', 'items.json');

// Initialize data files if they don't exist
const initializeDataFiles = () => {
	if (!fs.existsSync(championsFile)) {
		fs.writeFileSync(championsFile, JSON.stringify([], null, 2));
	}
	if (!fs.existsSync(itemsFile)) {
		fs.writeFileSync(itemsFile, JSON.stringify([], null, 2));
	}
};

initializeDataFiles();

// Helper functions
const readJSON = (filePath) => {
	try {
		const data = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		return [];
	}
};

const writeJSON = (filePath, data) => {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error('Failed to write JSON:', error);
		throw new Error('Failed to save data');
	}
};

// Safely resolve image path (prevent path traversal)
const safeImagePath = (imagePath, type = 'champions') => {
	if (!imagePath || !imagePath.startsWith('/uploads/')) {
		return null;
	}
	const filename = path.basename(imagePath);
	const safePath = path.join(__dirname, 'uploads', type, filename);

	// Ensure the path is within uploads directory
	const uploadsDir = path.join(__dirname, 'uploads', type);
	if (!safePath.startsWith(uploadsDir)) {
		return null;
	}
	return safePath;
};

// Delete all old images with same ID but different extensions
const deleteOldImages = (id, type, currentFilename) => {
	const uploadsDir = path.join(__dirname, 'uploads', type);
	const prefix = type === 'champions' ? `champion_${id}` : `item_${id}`;

	try {
		const files = fs.readdirSync(uploadsDir);
		files.forEach(file => {
			if (file.startsWith(prefix) && file !== currentFilename) {
				const filePath = path.join(uploadsDir, file);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		});
	} catch (error) {
		console.error('Failed to clean old images:', error);
	}
};

const getNextId = (items) => {
	if (items.length === 0) return 1;
	return Math.max(...items.map(item => item.id)) + 1;
};

// Multer configuration for champions (5MB limit)
const championStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, 'uploads', 'champions'));
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `champion_${req.params.id}${ext}`);
	}
});

// Multer configuration for items (5MB limit)
const itemStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, 'uploads', 'items'));
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `item_${req.params.id}${ext}`);
	}
});

const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
	const mime = allowedTypes.test(file.mimetype);
	if (ext && mime) {
		cb(null, true);
	} else {
		cb(new Error('Only image files are allowed'));
	}
};

const uploadChampion = multer({
	storage: championStorage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadItem = multer({
	storage: itemStorage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ============ CHAMPIONS API ============

// Get all champions (public)
app.get('/api/champions', (req, res) => {
	const champions = readJSON(championsFile);
	res.json(champions);
});

// Get single champion (public)
app.get('/api/champions/:id', (req, res) => {
	const champions = readJSON(championsFile);
	const champion = champions.find(c => c.id === parseInt(req.params.id));
	if (!champion) {
		return res.status(404).json({ error: 'Champion not found' });
	}
	res.json(champion);
});

// Create new champion (auth required)
app.post('/api/champions', authenticateToken, (req, res) => {
	const { name, roles } = req.body;
	if (!name) {
		return res.status(400).json({ error: 'Name is required' });
	}

	if (!isValidName(name)) {
		return res.status(400).json({ error: 'Invalid name format' });
	}

	const sanitizedName = sanitizeInput(name);
	const sanitizedRoles = Array.isArray(roles)
		? roles.filter(r => typeof r === 'string').map(r => sanitizeInput(r))
		: [];

	const champions = readJSON(championsFile);
	const newChampion = {
		id: getNextId(champions),
		name: sanitizedName,
		image: '/champions/default.png',
		roles: sanitizedRoles
	};

	champions.push(newChampion);
	writeJSON(championsFile, champions);
	res.status(201).json(newChampion);
});

// Update champion (auth required)
app.put('/api/champions/:id', authenticateToken, (req, res) => {
	const { name, roles } = req.body;
	const champions = readJSON(championsFile);
	const index = champions.findIndex(c => c.id === parseInt(req.params.id));

	if (index === -1) {
		return res.status(404).json({ error: 'Champion not found' });
	}

	if (name) {
		if (!isValidName(name)) {
			return res.status(400).json({ error: 'Invalid name format' });
		}
		champions[index].name = sanitizeInput(name);
	}
	if (roles) {
		champions[index].roles = Array.isArray(roles)
			? roles.filter(r => typeof r === 'string').map(r => sanitizeInput(r))
			: [];
	}

	writeJSON(championsFile, champions);
	res.json(champions[index]);
});

// Delete champion (auth required)
app.delete('/api/champions/:id', authenticateToken, (req, res) => {
	const champions = readJSON(championsFile);
	const index = champions.findIndex(c => c.id === parseInt(req.params.id));

	if (index === -1) {
		return res.status(404).json({ error: 'Champion not found' });
	}

	// Delete associated image if it exists (safely)
	const champion = champions[index];
	const imagePath = safeImagePath(champion.image, 'champions');
	if (imagePath && fs.existsSync(imagePath)) {
		fs.unlinkSync(imagePath);
	}

	champions.splice(index, 1);
	writeJSON(championsFile, champions);
	res.json({ message: 'Champion deleted' });
});

// Upload champion image (auth required)
app.post('/api/champions/:id/image', authenticateToken, strictLimiter, uploadChampion.single('image'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No image uploaded' });
	}

	const champions = readJSON(championsFile);
	const index = champions.findIndex(c => c.id === parseInt(req.params.id));

	if (index === -1) {
		// Delete uploaded file if champion not found
		fs.unlinkSync(req.file.path);
		return res.status(404).json({ error: 'Champion not found' });
	}

	// Delete all old images with same ID (handles different extensions)
	deleteOldImages(req.params.id, 'champions', req.file.filename);

	champions[index].image = `/uploads/champions/${req.file.filename}`;
	writeJSON(championsFile, champions);
	res.json(champions[index]);
});

// ============ ITEMS API ============

// Get all items (public)
app.get('/api/items', (req, res) => {
	const items = readJSON(itemsFile);
	res.json(items);
});

// Get single item (public)
app.get('/api/items/:id', (req, res) => {
	const items = readJSON(itemsFile);
	const item = items.find(i => i.id === parseInt(req.params.id));
	if (!item) {
		return res.status(404).json({ error: 'Item not found' });
	}
	res.json(item);
});

// Create new item (auth required)
app.post('/api/items', authenticateToken, (req, res) => {
	const { name } = req.body;
	if (!name) {
		return res.status(400).json({ error: 'Name is required' });
	}

	if (!isValidName(name)) {
		return res.status(400).json({ error: 'Invalid name format' });
	}

	const items = readJSON(itemsFile);
	const newItem = {
		id: getNextId(items),
		name: sanitizeInput(name),
		image: '/items/default.png'
	};

	items.push(newItem);
	writeJSON(itemsFile, items);
	res.status(201).json(newItem);
});

// Update item (auth required)
app.put('/api/items/:id', authenticateToken, (req, res) => {
	const { name } = req.body;
	const items = readJSON(itemsFile);
	const index = items.findIndex(i => i.id === parseInt(req.params.id));

	if (index === -1) {
		return res.status(404).json({ error: 'Item not found' });
	}

	if (name) {
		if (!isValidName(name)) {
			return res.status(400).json({ error: 'Invalid name format' });
		}
		items[index].name = sanitizeInput(name);
	}

	writeJSON(itemsFile, items);
	res.json(items[index]);
});

// Delete item (auth required)
app.delete('/api/items/:id', authenticateToken, (req, res) => {
	const items = readJSON(itemsFile);
	const index = items.findIndex(i => i.id === parseInt(req.params.id));

	if (index === -1) {
		return res.status(404).json({ error: 'Item not found' });
	}

	// Delete associated image if it exists (safely)
	const item = items[index];
	const imagePath = safeImagePath(item.image, 'items');
	if (imagePath && fs.existsSync(imagePath)) {
		fs.unlinkSync(imagePath);
	}

	items.splice(index, 1);
	writeJSON(itemsFile, items);
	res.json({ message: 'Item deleted' });
});

// Upload item image (auth required)
app.post('/api/items/:id/image', authenticateToken, strictLimiter, uploadItem.single('image'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No image uploaded' });
	}

	const items = readJSON(itemsFile);
	const index = items.findIndex(i => i.id === parseInt(req.params.id));

	if (index === -1) {
		// Delete uploaded file if item not found
		fs.unlinkSync(req.file.path);
		return res.status(404).json({ error: 'Item not found' });
	}

	// Delete all old images with same ID (handles different extensions)
	deleteOldImages(req.params.id, 'items', req.file.filename);

	items[index].image = `/uploads/items/${req.file.filename}`;
	writeJSON(itemsFile, items);
	res.json(items[index]);
});

// ============ INITIALIZATION API ============

// Initialize champions from static data (auth required)
app.post('/api/init/champions', authenticateToken, strictLimiter, (req, res) => {
	const { champions } = req.body;
	if (!champions || !Array.isArray(champions)) {
		return res.status(400).json({ error: 'Champions array is required' });
	}
	writeJSON(championsFile, champions);
	res.json({ message: 'Champions initialized', count: champions.length });
});

// Initialize items from static data (auth required)
app.post('/api/init/items', authenticateToken, strictLimiter, (req, res) => {
	const { items } = req.body;
	if (!items || !Array.isArray(items)) {
		return res.status(400).json({ error: 'Items array is required' });
	}
	writeJSON(itemsFile, items);
	res.json({ message: 'Items initialized', count: items.length });
});

// Error handling middleware
app.use((err, req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ error: 'Dosya boyutu 5MB\'dan büyük olamaz' });
	}
	console.error(err.stack);
	res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`CORS origin: ${corsOrigin}`);
	console.log(`Champions data: ${championsFile}`);
	console.log(`Items data: ${itemsFile}`);
});
