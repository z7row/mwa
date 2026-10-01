const b = require('bcryptjs');
const p = process.argv[2];
if (!p || p.length < 12) { console.error('Usage: npm run hash -- "your-long-password"  (min 12 chars)'); process.exit(1); }
console.log(Buffer.from(b.hashSync(p, 12)).toString('base64'));
