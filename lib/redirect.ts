/** Only allow same-site relative paths as redirect targets. */
export function safePath(candidate: unknown, fallback = '/'): string {
  if (typeof candidate !== 'string') return fallback;
  const value = candidate.trim();
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

export function withFlash(path: string, message: string, tone: 'ok' | 'error' = 'ok') {
  const [base, hash] = path.split('#');
  const url = new URL(base, 'http://local');
  url.searchParams.set('flash', message);
  url.searchParams.set('flashTone', tone);
  return `${url.pathname}${url.search}${hash ? `#${hash}` : ''}`;
}

/**
 * Redirect using a *relative* Location header.
 *
 * NextResponse.redirect() needs an absolute URL, and building one from
 * `request.url` leaks the internal bind host (0.0.0.0 / an internal proxy name)
 * into the browser — which makes the browser treat it as a different origin and
 * drop the session/cart cookies. A relative Location is resolved against the URL
 * the customer is already on, so it is safe behind any proxy or custom domain.
 */
export function redirectTo(_request: Request, path: string, status: 303 | 307 = 303) {
  const safe = path.startsWith('/') ? path : `/${path}`;
  return new Response(null, { status, headers: { location: safe } });
}

export function backTo(form: FormData, request: Request, fallback = '/') {
  const next = form.get('next');
  if (typeof next === 'string' && next) return safePath(next, fallback);
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === new URL(request.url).origin) return safePath(url.pathname + url.search, fallback);
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

/** Extract JSON fields from a request that may be form-encoded or JSON. */
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    try {
      return (await request.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  const form = await request.formData();
  const out: Record<string, unknown> = {};
  form.forEach((value, key) => {
    out[key] = typeof value === 'string' ? value : value;
  });
  return out;
}
