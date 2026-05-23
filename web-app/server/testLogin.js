const http = require('http');

const postData = JSON.stringify({
  email: 'admin@pinqoza.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('Server is not running on port 5000. Please start the server first.');
  }
});

req.write(postData);
req.end();
