import crypto from 'crypto';

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateLicenseKey() {
  const body = crypto.randomBytes(18).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  return `MWD-${body.match(/.{1,4}/g)?.join('-') || body}`;
}
