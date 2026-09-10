/* Turns the band's shared word into the single secret the API needs.
 *
 *   npm run secret:hash -- "three random words here"
 *
 * Prints one line to paste into .dev.vars locally, and into
 * Pages > Settings > Environment variables (encrypted) for production AND
 * preview. Preview is easy to forget and every auth call 500s without it.
 *
 * The passphrase itself is never written to disk by this script.
 */
import { webcrypto as crypto } from 'node:crypto';

const passphrase = process.argv.slice(2).join(' ').trim();
if (!passphrase) {
  console.error('Usage: npm run secret:hash -- "the band word"');
  process.exit(1);
}
if (passphrase.length < 8) {
  console.error('That is short enough to guess. Use several words.');
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits']
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256
);

const rand = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));

console.log('\nJAM_PASSPHRASE_HASH=' + hex(salt) + ':' + hex(bits));
console.log('\nAnd if you have not generated these yet:\n');
console.log('SESSION_HMAC_KEY=' + rand(32));
console.log('IP_SALT=' + rand(16));
console.log('ADMIN_TOKEN=' + rand(32));
console.log('');
