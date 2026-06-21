/**
 * Direct backend test — bypasses browser and CORS entirely.
 * Run: node test-post.js
 */
const http = require('http');

// Read token from localStorage backup file or hardcode it
const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.log('Usage: node test-post.js <YOUR_JWT_TOKEN>');
  console.log('');
  console.log('Get your token from browser console:');
  console.log('  localStorage.getItem("userToken")');
  process.exit(1);
}

const payload = JSON.stringify({
  title: 'Test Job from Node',
  description: 'Testing if backend accepts POST',
  location: 'Remote',
  budget: 500,
  category: 'OTHER',
  skillsRequired: ['testing']
});

const options = {
  hostname: '172.22.17.116',
  port: 8080,
  path: '/provider/jobs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log('');
console.log('═══════════════════════════════════════');
console.log('🧪 DIRECT BACKEND TEST (no browser!)');
console.log('═══════════════════════════════════════');
console.log('📡 Target:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('📋 Method:', options.method);
console.log('🔑 Token:', TOKEN.substring(0, 30) + '...');
console.log('📦 Payload:', payload);
console.log('═══════════════════════════════════════');
console.log('');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📊 Status:', res.statusCode);
    console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
    console.log('📦 Body:', data || '(empty)');
    console.log('');
    if (res.statusCode === 403) {
      console.log('🔴 RESULT: Backend returned 403 even from Node.js!');
      console.log('   This proves it is NOT a CORS or browser issue.');
      console.log('   Your Spring Boot SecurityConfig needs fixing:');
      console.log('   - .csrf(csrf -> csrf.disable())');
      console.log('   - Check your JWT filter is processing the token');
    } else if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('🟢 RESULT: Backend accepted the request!');
      console.log('   The issue is browser CORS, not the backend.');
    } else {
      console.log('🟡 RESULT: Unexpected status code:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
  console.log('Make sure the backend is running at', `${options.hostname}:${options.port}`);
});

req.write(payload);
req.end();
