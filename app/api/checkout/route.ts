import { createOrderFromCart } from '@/lib/orders';
import { getSession } from '@/lib/auth';
import { checkoutSchema, zodMessage } from '@/lib/validate';
import { initializePayment } from '@/lib/payments';
import { readCartToken } from '@/lib/cart';
import { redirectTo, withFlash } from '@/lib/redirect';
import { clientIp, rateLimit } from '@/lib/http';
import { sendMail, orderConfirmationText } from '@/lib/notify';

/**
 * Server-side order creation. Cart prices, stock, coupon and delivery fee are all
 * re-validated in createOrderFromCart before anything is written or charged.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const limit = rateLimit(`checkout:${clientIp(request)}`, 12, 5 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/checkout', 'Too many checkout attempts. Please wait a moment.', 'error'));
  }

  const parsed = checkoutSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/checkout', zodMessage(parsed.error), 'error'));
  }

  const session = await getSession();
  const cartToken = await readCartToken();
  const result = await createOrderFromCart(parsed.data, { userId: session?.id ?? null, cartToken });

  if (!result.ok) {
    return redirectTo(request, withFlash('/checkout', result.message, 'error'));
  }

  const { order } = result;

  // Fire-and-forget confirmation email (persisted order is the source of truth).
  void sendMail({
    to: parsed.data.email,
    subject: `Zakson order ${order.reference} received`,
    text: orderConfirmationText({
      reference: order.reference,
      customer_name: parsed.data.fullName,
      total_kobo: order.totalKobo,
      delivery_city: parsed.data.city,
      delivery_state: parsed.data.state,
    }),
  });

  try {
    const payment = await initializePayment({
      reference: order.reference,
      amountKobo: order.totalKobo,
      email: parsed.data.email,
      name: parsed.data.fullName,
      phone: parsed.data.phone,
      orderToken: order.accessToken,
    });

    const target = payment.authorizationUrl.startsWith('/')
      ? payment.authorizationUrl
      : payment.authorizationUrl;
    return redirectTo(request, target, 303);
  } catch (error) {
    console.error('payment init failed', error);
    return redirectTo(
      request,
      `/checkout/complete?reference=${encodeURIComponent(order.reference)}&token=${encodeURIComponent(
        order.accessToken,
      )}`,
    );
  }
}
