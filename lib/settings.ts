import { db } from '@/lib/db';

let cache: { values: Record<string, string>; at: number } | null = null;
const TTL = 5_000;

export function getAllSettings(): Record<string, string> {
  if (cache && Date.now() - cache.at < TTL) return cache.values;
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  cache = { values, at: Date.now() };
  return values;
}

export function getSetting(key: string): string | undefined {
  return getAllSettings()[key];
}

export function setSetting(key: string, value: string) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
    key,
    value,
  );
  cache = null;
}

export function clearSettingsCache() {
  cache = null;
}

export type StoreInfo = {
  name: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  landmark: string;
  hours: string;
  instagram: string;
  facebook: string;
  twitter: string;
  announcement: string;
  returnWindowDays: number;
};

export function getStoreInfo(): StoreInfo {
  const s = getAllSettings();
  return {
    name: s.store_name || 'Zakson',
    owner: s.owner_name || 'Musty Zakari',
    email: s.support_email || 'mustaphazakari081@gmail.com',
    phone: s.support_phone || '09034422971',
    city: s.location_city || 'Jos North',
    state: s.location_state || 'Plateau State',
    country: s.location_country || 'Nigeria',
    landmark: s.landmark || 'Terminus Market Overhead Bridge',
    hours: s.store_hours || 'Mon–Sat, 8:00 – 19:00 (WAT)',
    instagram: s.instagram || '',
    facebook: s.facebook || '',
    twitter: s.twitter || '',
    announcement: s.announcement || '',
    returnWindowDays: Number(s.return_window_days || 7),
  };
}
