export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:30178').replace(/\/+$/, '');
}

export function getDiscordUrl() {
  return process.env.DISCORD_URL || 'https://discord.gg/mwdev';
}

export function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || 'support@mw-dev.fr';
}

export function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} manquant`);
  }
  return value;
}
