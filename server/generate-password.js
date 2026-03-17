import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
	console.error('Kullanım: node generate-password.js <şifre>');
	process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nBcrypt Hash:');
console.log(hash);
console.log('\nBu hash\'i server/.env dosyasındaki ADMIN_PASSWORD_HASH\'e yapıştırın.');
