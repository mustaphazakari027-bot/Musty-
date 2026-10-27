import crypto from 'node:crypto';

export type Provider = 'paystack' | 'flutterwave' | 'demo';

export function demoPaymentsEnabled() {
  return process.env.ALLOW_DEMO_PAYMENTS !== 'false';
}

export function activeProvider(): Provider {
  const explicit = (process.env.PAYMENT_PROVIDER || '').toLowerCase();
  if (explicit === 'paystack' || explicit === 'flutterwave' || explicit === 'demo') return explicit;
  if (process.env.PAYSTACK_SECRET_KEY) return 'paystack';
  if (process.env.FLUTTERWAVE_SECRET_KEY) return 'flutterwave';
  return 'demo';
}

export function providerStatus() {
  return {
    provider: activeProvider(),
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
    flutterwave: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
    demoAllowed: demoPaymentsEnabled(),
    live: Boolean(process.env.PAYSTACK_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY),
  };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

type InitInput = {
  reference: string;
  amountKobo: number;
  email: string;
  name: string;
  phone: string;
  orderToken: string;
};

export type InitResult = {
  provider: Provider;
  authorizationUrl: string;
  reference: string;
};

/**
 * Start a payment. Secrets are only ever read on the server.
 * Demo mode returns an internal simulated checkout page.
 */
export async function initializePayment(input: InitInput): Promise<InitResult> {
  const provider = activeProvider();

  if (provider === 'paystack') {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: 'NGN',
        reference: input.reference,
        callback_url: `${siteUrl()}/checkout/complete?reference=${input.reference}&token=${input.orderToken}`,
        metadata: { order_reference: input.reference, customer_name: input.name, phone: input.phone },
      }),
      cache: 'no-store',
    });
    const json = (await res.json()) as { status: boolean; data?: { authorization_url: string; reference: string }; message?: string };
    if (!res.ok || !json.status || !json.data) {
      throw new Error(json.message || 'Unable to start Paystack payment.');
    }
    return { provider, authorizationUrl: json.data.authorization_url, reference: json.data.reference };
  }

  if (provider === 'flutterwave') {
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: input.reference,
        amount: (input.amountKobo / 100).toFixed(2),
        currency: 'NGN',
        redirect_url: `${siteUrl()}/checkout/complete?reference=${input.reference}&token=${input.orderToken}`,
        customer: { email: input.email, name: input.name, phonenumber: input.phone },
        customizations: { title: 'Zakson', description: 'Premium sports footwear' },
      }),
      cache: 'no-store',
    });
    const json = (await res.json()) as { status: string; data?: { link: string }; message?: string };
    if (!res.ok || json.status !== 'success' || !json.data) {
      throw new Error(json.message || 'Unable to start Flutterwave payment.');
    }
    return { provider, authorizationUrl: json.data.link, reference: input.reference };
  }

  return {
    provider: 'demo',
    authorizationUrl: `/checkout/demo?reference=${encodeURIComponent(input.reference)}&token=${encodeURIComponent(
      input.orderToken,
    )}`,
    reference: input.reference,
  };
}

export type VerifyResult = {
  status: 'paid' | 'failed' | 'pending';
  amountKobo: number;
  reference: string;
  provider: Provider;
  raw: unknown;
};

/** Server-side verification — never trust the callback query string alone. */
export async function verifyPayment(provider: Provider, reference: string): Promise<VerifyResult> {
  if (provider === 'paystack') {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: 'no-store',
    });
    const json = (await res.json()) as {
      status: boolean;
      data?: { status: string; amount: number; reference: string };
    };
    const data = json.data;
    const status = data?.status === 'success' ? 'paid' : data?.status === 'failed' ? 'failed' : 'pending';
    return { status, amountKobo: data?.amount ?? 0, reference: data?.reference ?? reference, provider, raw: json };
  }

  if (provider === 'flutterwave') {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }, cache: 'no-store' },
    );
    const json = (await res.json()) as {
      status: string;
      data?: { status: string; amount: number; tx_ref: string; currency: string };
    };
    const data = json.data;
    const ok = data?.status === 'successful' && (data?.currency === 'NGN' || !data?.currency);
    const status = ok ? 'paid' : data?.status === 'failed' ? 'failed' : 'pending';
    return {
      status,
      amountKobo: Math.round((data?.amount ?? 0) * 100),
      reference: data?.tx_ref ?? reference,
      provider,
      raw: json,
    };
  }

  return { status: 'pending', amountKobo: 0, reference, provider: 'demo', raw: { demo: true } };
}

/** Paystack webhook signature validation (x-paystack-signature = HMAC SHA512 of raw body). */
export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Flutterwave sends a static hash in the `verif-hash` header. */
export function verifyFlutterwaveSignature(signature: string | null) {
  const hash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!hash || !signature) return false;
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
