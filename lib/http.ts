import { NextResponse } from 'next/server';

export function jsonOk<T extends object>(data: T, init?: number) {
  return NextResponse.json({ ok: true, ...data }, { status: init ?? 200 });
}

export function jsonError(message: string, status = 400, extra: object = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

/** Tiny in-memory rate limiter — enough to stop casual form spam on a single node. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
}

export function parseJson<T>(value: unknown): T | null {
  try {
    return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
  } catch {
    return null;
  }
}
