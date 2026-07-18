import crypto from 'crypto';

// Generate a 64-character hex string
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('Your JWT Secret Key:');
console.log(jwtSecret);
console.log('\nCopy this and add it to your .env file as JWT_SECRET');