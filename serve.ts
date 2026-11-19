// A small static server for local testing of the guide (Node 22, standard
// library only). It serves app/ on http://127.0.0.1:8080 by default —
// `node serve.ts --port <n>` picks another port. It sends the MIME types a
// browser needs, refuses any path that escapes app/, and does nothing else:
// a development convenience, not a server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendError(response: import('node:http').ServerResponse, code: number, text: string): void {
  response.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(text);
}

createServer((request, response) => {
  const rawPath = request.url ?? '/';
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(rawPath, 'http://localhost').pathname);
  } catch {
    sendError(response, 400, 'bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    sendError(response, 403, 'forbidden');
    return;
  }
  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    sendError(response, 404, 'not found');
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  // A HEAD request gets the headers only; a GET gets the file itself.
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Leonida Trophy Guide is on http://localhost:${port}`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`port ${port} is already in use — try node serve.ts --port <another port>`);
  } else {
    console.error(`server failed to start: ${error.message}`);
  }
  process.exit(1);
});
