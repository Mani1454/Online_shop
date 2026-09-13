const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PREVIEW_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/live_demo.html' : req.url;
  // Strip query parameters
  reqPath = reqPath.split('?')[0];

  const filePath = path.join(PREVIEW_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If not found, fall back to live_demo.html
      const fallbackPath = path.join(PREVIEW_DIR, 'live_demo.html');
      fs.readFile(fallbackPath, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Apna Kirana Preview Server running at: http://localhost:${PORT}/`);
  console.log(`- Unified Live Demo: http://localhost:${PORT}/live_demo.html`);
  console.log(`- Customer App: http://localhost:${PORT}/index.html`);
  console.log(`- Admin Tablet: http://localhost:${PORT}/admin.html`);
});
