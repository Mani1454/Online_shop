const https = require('https');

const url = 'https://storage.googleapis.com/eas-workflows-production/logs/15de8dbb-d047-4f7b-a3df-b5c1d653783f/1f78b8b6-d9bc-4863-9184-42f4dcfe005f/2026-09-13T15%3A37%3A07Z-d4c42f30-7e04-496b-b018-be4c60fa8cc6.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260913%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260913T154633Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=158ef5155da43395c120d36c75d34d2073c2ff55f2ff8d1a557438300baf3cb13972fc38537e39bc452533c088424b1e4e9b1c3e9656764fe57717bcfa6d724a43af31e970ae4747ff09fd44f9702d2c4f6e951f0a01fa7e58959cdd3cbd16a2de98983d2214f3f0a6f9a76abbf3e10d83c320b5e212b7b59ec0342f50059ad08e5f458f4a07323aee5ef99de84cb91f6f82b332380b5c9cdb5ef52a011b40e21bcfd08cc89c8c52df25d717c03c29760ae00b9274b0f53f3b2ef13c331c51c61394af6f2d6ce04d029b509df53f0b64c41aef9ceb2e3c4e45446ac83dfa2b87fc492510bf75516895ab4d6a8ac8ac08ae69b374223079ba494ac53687df6db1';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    console.log('Total lines:', lines.length);
    const errorLines = lines.filter(l => l.includes('FAILURE') || l.includes('FAILED') || l.includes('error') || l.includes('Exception'));
    console.log('Error matches count:', errorLines.length);
    errorLines.slice(-15).forEach(l => console.log('-->', l.slice(0, 200)));
  });
}).on('error', err => console.error(err));
