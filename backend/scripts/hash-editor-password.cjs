const { randomBytes, scrypt } = require('node:crypto');
let password = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { password += chunk; });
process.stdin.on('end', () => {
  if (!password || password.length > 1024) {
    console.error('Provide a password of 1–1024 characters on stdin.');
    process.exitCode = 1;
    return;
  }
  const salt = randomBytes(16).toString('hex');
  scrypt(password, salt, 64, (err, key) => {
    if (err) throw err;
    console.log(`${salt}:${key.toString('hex')}`);
  });
});
