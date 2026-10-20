// Build-time environment validation.
// Fails the build if VITE_API_BASE_URL is missing or points at localhost,
// preventing a deployed frontend from calling the end-user's own device.
import { URL } from 'node:url';

const raw = process.env.VITE_API_BASE_URL;
const isProd = process.env.NODE_ENV === 'production' || process.env.VERB_ENV === 'production';

if (!raw || raw.trim() === '') {
  console.error('FATAL: VITE_API_BASE_URL is not set. Aborting build.');
  process.exit(1);
}

let url;
try {
  url = new URL(raw.trim());
} catch {
  console.error(`FATAL: VITE_API_BASE_URL is not a valid URL: ${raw}`);
  process.exit(1);
}

const isLocalhost =
  url.hostname === 'localhost' ||
  url.hostname === '127.0.0.1' ||
  url.hostname === '0.0.0.0' ||
  url.hostname === '[::1]' ||
  url.hostname.endsWith('.localhost');

if (isLocalhost) {
  console.error(`FATAL: VITE_API_BASE_URL points at localhost (${raw}). A deployed frontend must not call the user's device. Aborting build.`);
  process.exit(1);
}

if (isProd && url.protocol !== 'https:') {
  console.error(`FATAL: VITE_API_BASE_URL must use HTTPS in production: ${raw}`);
  process.exit(1);
}

console.log(`OK: VITE_API_BASE_URL=${url.origin}`);
