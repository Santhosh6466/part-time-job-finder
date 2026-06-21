/**
 * End-to-end test: Login → Post Job
 * Run: node test-e2e.js
 */
const http = require('http');

const BACKEND = 'http://172.22.17.116:8080';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND + path);
    const payload = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('\n═══ STEP 1: LOGIN ═══');
  const login = await request('POST', '/auth/login', {
    email: 'santhoshchode8469@gmail.com',
    password: 'Test@123'
  });
  console.log('Status:', login.status);
  console.log('Body:', login.body);

  if (login.status !== 200) {
    console.log('\n❌ Login failed! Cannot proceed.');
    console.log('If your password is different, edit test-e2e.js line 44');
    return;
  }

  // Extract token
  let parsed;
  try { parsed = JSON.parse(login.body); } catch { console.log('❌ Cannot parse login response'); return; }
  const token = parsed?.data?.token || parsed?.token || parsed?.data?.accessToken || parsed?.accessToken;
  
  if (!token) {
    console.log('❌ No token in response:', login.body);
    return;
  }

  console.log('✅ Got token:', token.substring(0, 30) + '...');
  
  // Decode it
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('📋 JWT payload:', JSON.stringify(payload, null, 2));
  } catch {}

  console.log('\n═══ STEP 2: POST JOB ═══');
  const job = await request('POST', '/provider/jobs', {
    title: 'Node Test Job',
    description: 'Testing from Node.js directly',
    location: 'Remote',
    budget: 500,
    category: 'OTHER',
    skillsRequired: ['testing']
  }, token);
  
  console.log('Status:', job.status);
  console.log('Body:', job.body || '(empty)');
  
  if (job.status === 200 || job.status === 201) {
    console.log('\n🟢 SUCCESS! Job posted from Node.js!');
    console.log('   → The frontend code is correct.');
    console.log('   → The 403 in the browser is a CORS issue.');
  } else if (job.status === 403) {
    console.log('\n🔴 FAILED! Backend returned 403 from Node.js too!');
    console.log('   → This is NOT a frontend issue.');
    console.log('   → Your Spring Boot backend rejects the request.');
  }
}

main().catch(e => console.error('❌ Error:', e.message));
