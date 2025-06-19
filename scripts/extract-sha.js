const fs = require('fs');
const jks = require('jks-js');
const crypto = require('crypto');

const keystorePath = process.argv[2] || 'android/keystores/upload-keystore.jks';
const storePass = process.argv[3] || 'PitaraStorePass123';

if (!fs.existsSync(keystorePath)) {
  console.error(`Keystore not found at ${keystorePath}`);
  process.exit(1);
}

const ks = jks.toPem(fs.readFileSync(keystorePath), storePass);
const alias = Object.keys(ks)[0];
const certPem = ks[alias].cert || ks[alias].ca;

const der = Buffer.from(
  certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, ''),
  'base64'
);

const sha1 = crypto.createHash('sha1').update(der).digest('hex').toUpperCase().match(/.{2}/g).join(':');
const sha256 = crypto.createHash('sha256').update(der).digest('hex').toUpperCase().match(/.{2}/g).join(':');

console.log('Alias      :', alias);
console.log('SHA-1      :', sha1);
console.log('SHA-256    :', sha256); 