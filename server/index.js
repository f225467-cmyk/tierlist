import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// ============ DATABASE ============

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_URL?.includes('neon.tech')
		? { rejectUnauthorized: false }
		: false
});

async function initDB() {
	const client = await pool.connect();
	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS champions (
				id SERIAL PRIMARY KEY,
				name VARCHAR(100) NOT NULL,
				image VARCHAR(500) DEFAULT '/champions/default.png',
				roles TEXT[] DEFAULT '{}',
				image_data TEXT,
				image_mime VARCHAR(50)
			)
		`);
		await client.query(`
			CREATE TABLE IF NOT EXISTS items (
				id SERIAL PRIMARY KEY,
				name VARCHAR(100) NOT NULL,
				image VARCHAR(500) DEFAULT '/items/default.png',
				image_data TEXT,
				image_mime VARCHAR(50)
			)
		`);
		console.log('Database tables ready');
	} finally {
		client.release();
	}
}

// ============ MIDDLEWARE ============

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
	origin: corsOrigin.split(',').map(s => s.trim()),
	credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 100,
	message: { error: 'Too many requests, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false
});

const strictLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 20,
	message: { error: 'Too many requests, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false
});

const loginLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 5,
	message: { error: 'Çok fazla giriş denemesi. Lütfen 1 dakika bekleyin.' },
	standardHeaders: true,
	legacyHeaders: false
});

app.use('/api', apiLimiter);

// ============ AUTH ============

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

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

// ============ HELPERS ============

const sanitizeInput = (str) => {
	if (typeof str !== 'string') return str;
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.trim()
		.slice(0, 100);
};

const isValidName = (name) => {
	if (typeof name !== 'string') return false;
	if (name.trim().length === 0 || name.length > 100) return false;
	return /^[\p{L}\p{N}\s\-'.]+$/u.test(name);
};

// Multer memory storage (image goes to buffer, then to DB)
const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png|gif|webp/;
		const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
		const mime = allowedTypes.test(file.mimetype);
		if (ext && mime) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	},
	limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ============ IMAGE SERVING FROM DB ============

app.get('/api/images/champions/:id', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT image_data, image_mime FROM champions WHERE id = $1',
			[parseInt(req.params.id)]
		);
		if (result.rows.length === 0 || !result.rows[0].image_data) {
			return res.status(404).json({ error: 'Image not found' });
		}
		const { image_data, image_mime } = result.rows[0];
		const buffer = Buffer.from(image_data, 'base64');
		res.set('Content-Type', image_mime);
		res.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
		res.send(buffer);
	} catch (err) {
		res.status(500).json({ error: 'Failed to load image' });
	}
});

app.get('/api/images/items/:id', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT image_data, image_mime FROM items WHERE id = $1',
			[parseInt(req.params.id)]
		);
		if (result.rows.length === 0 || !result.rows[0].image_data) {
			return res.status(404).json({ error: 'Image not found' });
		}
		const { image_data, image_mime } = result.rows[0];
		const buffer = Buffer.from(image_data, 'base64');
		res.set('Content-Type', image_mime);
		res.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
		res.send(buffer);
	} catch (err) {
		res.status(500).json({ error: 'Failed to load image' });
	}
});

// ============ CHAMPIONS API ============

app.get('/api/champions', async (req, res) => {
	try {
		const result = await pool.query('SELECT id, name, image, roles, image_data, image_mime FROM champions ORDER BY id');
		res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
		const rows = result.rows.map(row => {
			const obj = { id: row.id, name: row.name, image: row.image, roles: row.roles };
			if (row.image_data && row.image_mime) {
				obj.thumbnail = `data:${row.image_mime};base64,${row.image_data}`;
			}
			return obj;
		});
		res.json(rows);
	} catch (err) {
		console.error('Failed to fetch champions:', err);
		res.status(500).json({ error: 'Failed to fetch champions' });
	}
});

app.get('/api/champions/:id', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, name, image, roles FROM champions WHERE id = $1',
			[parseInt(req.params.id)]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Champion not found' });
		}
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch champion' });
	}
});

app.post('/api/champions', authenticateToken, async (req, res) => {
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

	try {
		const result = await pool.query(
			'INSERT INTO champions (name, image, roles) VALUES ($1, $2, $3) RETURNING id, name, image, roles',
			[sanitizedName, '/champions/default.png', sanitizedRoles]
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error('Failed to create champion:', err);
		res.status(500).json({ error: 'Failed to create champion' });
	}
});

app.put('/api/champions/:id', authenticateToken, async (req, res) => {
	const { name, roles } = req.body;
	const id = parseInt(req.params.id);

	try {
		const existing = await pool.query('SELECT * FROM champions WHERE id = $1', [id]);
		if (existing.rows.length === 0) {
			return res.status(404).json({ error: 'Champion not found' });
		}

		const updates = [];
		const values = [];
		let paramIdx = 1;

		if (name) {
			if (!isValidName(name)) {
				return res.status(400).json({ error: 'Invalid name format' });
			}
			updates.push(`name = $${paramIdx++}`);
			values.push(sanitizeInput(name));
		}
		if (roles) {
			const sanitizedRoles = Array.isArray(roles)
				? roles.filter(r => typeof r === 'string').map(r => sanitizeInput(r))
				: [];
			updates.push(`roles = $${paramIdx++}`);
			values.push(sanitizedRoles);
		}

		if (updates.length > 0) {
			values.push(id);
			const result = await pool.query(
				`UPDATE champions SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, name, image, roles`,
				values
			);
			res.json(result.rows[0]);
		} else {
			res.json(existing.rows[0]);
		}
	} catch (err) {
		console.error('Failed to update champion:', err);
		res.status(500).json({ error: 'Failed to update champion' });
	}
});

app.delete('/api/champions/:id', authenticateToken, async (req, res) => {
	try {
		const result = await pool.query('DELETE FROM champions WHERE id = $1 RETURNING id', [parseInt(req.params.id)]);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Champion not found' });
		}
		res.json({ message: 'Champion deleted' });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete champion' });
	}
});

app.post('/api/champions/:id/image', authenticateToken, strictLimiter, upload.single('image'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No image uploaded' });
	}

	const id = parseInt(req.params.id);
	const imageData = req.file.buffer.toString('base64');
	const imageMime = req.file.mimetype;

	try {
		const result = await pool.query(
			`UPDATE champions SET image = $1, image_data = $2, image_mime = $3 WHERE id = $4 RETURNING id, name, image, roles`,
			[`/api/images/champions/${id}`, imageData, imageMime, id]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Champion not found' });
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error('Failed to upload champion image:', err);
		res.status(500).json({ error: 'Failed to upload image' });
	}
});

// ============ ITEMS API ============

app.get('/api/items', async (req, res) => {
	try {
		const result = await pool.query('SELECT id, name, image, image_data, image_mime FROM items ORDER BY id');
		res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
		const rows = result.rows.map(row => {
			const obj = { id: row.id, name: row.name, image: row.image };
			if (row.image_data && row.image_mime) {
				obj.thumbnail = `data:${row.image_mime};base64,${row.image_data}`;
			}
			return obj;
		});
		res.json(rows);
	} catch (err) {
		console.error('Failed to fetch items:', err);
		res.status(500).json({ error: 'Failed to fetch items' });
	}
});

app.get('/api/items/:id', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, name, image FROM items WHERE id = $1',
			[parseInt(req.params.id)]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Item not found' });
		}
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch item' });
	}
});

app.post('/api/items', authenticateToken, async (req, res) => {
	const { name } = req.body;
	if (!name) {
		return res.status(400).json({ error: 'Name is required' });
	}
	if (!isValidName(name)) {
		return res.status(400).json({ error: 'Invalid name format' });
	}

	try {
		const result = await pool.query(
			'INSERT INTO items (name, image) VALUES ($1, $2) RETURNING id, name, image',
			[sanitizeInput(name), '/items/default.png']
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error('Failed to create item:', err);
		res.status(500).json({ error: 'Failed to create item' });
	}
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
	const { name } = req.body;
	const id = parseInt(req.params.id);

	try {
		const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
		if (existing.rows.length === 0) {
			return res.status(404).json({ error: 'Item not found' });
		}

		if (name) {
			if (!isValidName(name)) {
				return res.status(400).json({ error: 'Invalid name format' });
			}
			const result = await pool.query(
				'UPDATE items SET name = $1 WHERE id = $2 RETURNING id, name, image',
				[sanitizeInput(name), id]
			);
			res.json(result.rows[0]);
		} else {
			res.json(existing.rows[0]);
		}
	} catch (err) {
		console.error('Failed to update item:', err);
		res.status(500).json({ error: 'Failed to update item' });
	}
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
	try {
		const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [parseInt(req.params.id)]);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Item not found' });
		}
		res.json({ message: 'Item deleted' });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete item' });
	}
});

app.post('/api/items/:id/image', authenticateToken, strictLimiter, upload.single('image'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No image uploaded' });
	}

	const id = parseInt(req.params.id);
	const imageData = req.file.buffer.toString('base64');
	const imageMime = req.file.mimetype;

	try {
		const result = await pool.query(
			`UPDATE items SET image = $1, image_data = $2, image_mime = $3 WHERE id = $4 RETURNING id, name, image`,
			[`/api/images/items/${id}`, imageData, imageMime, id]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Item not found' });
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error('Failed to upload item image:', err);
		res.status(500).json({ error: 'Failed to upload image' });
	}
});

// ============ INITIALIZATION API ============

app.post('/api/init/champions', authenticateToken, strictLimiter, async (req, res) => {
	const { champions } = req.body;
	if (!champions || !Array.isArray(champions)) {
		return res.status(400).json({ error: 'Champions array is required' });
	}

	try {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query('DELETE FROM champions');
			for (const champ of champions) {
				await client.query(
					'INSERT INTO champions (id, name, image, roles) VALUES ($1, $2, $3, $4)',
					[champ.id, champ.name, champ.image || '/champions/default.png', champ.roles || []]
				);
			}
			// Reset sequence to max id
			await client.query(`SELECT setval('champions_id_seq', (SELECT COALESCE(MAX(id), 0) FROM champions))`);
			await client.query('COMMIT');
			res.json({ message: 'Champions initialized', count: champions.length });
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('Failed to initialize champions:', err);
		res.status(500).json({ error: 'Failed to initialize champions' });
	}
});

app.post('/api/init/items', authenticateToken, strictLimiter, async (req, res) => {
	const { items } = req.body;
	if (!items || !Array.isArray(items)) {
		return res.status(400).json({ error: 'Items array is required' });
	}

	try {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query('DELETE FROM items');
			for (const item of items) {
				await client.query(
					'INSERT INTO items (id, name, image) VALUES ($1, $2, $3)',
					[item.id, item.name, item.image || '/items/default.png']
				);
			}
			await client.query(`SELECT setval('items_id_seq', (SELECT COALESCE(MAX(id), 0) FROM items))`);
			await client.query('COMMIT');
			res.json({ message: 'Items initialized', count: items.length });
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('Failed to initialize items:', err);
		res.status(500).json({ error: 'Failed to initialize items' });
	}
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ error: 'Dosya boyutu 5MB\'dan büyük olamaz' });
	}
	console.error(err.stack);
	res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// ============ START ============

initDB().then(() => {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
		console.log(`CORS origin: ${corsOrigin}`);
		console.log(`Database: connected`);
	});
}).catch(err => {
	console.error('Failed to initialize database:', err);
	process.exit(1);
});
