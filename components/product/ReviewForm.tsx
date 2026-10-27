import Link from 'next/link';
import { Stars } from '@/components/ui';

export function ReviewForm({
  productId,
  loggedIn,
  slug,
}: {
  productId: number;
  loggedIn: boolean;
  slug: string;
}) {
  if (!loggedIn) {
    return (
      <div className="mt-4 rounded-2xl border border-line/70 bg-white p-4">
        <p className="text-[12.5px] font-semibold text-ink">Bought this pair?</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink/50">
          Sign in to leave a review. Reviews from customers with a delivered order are marked “Verified”.
        </p>
        <Link href={`/account/login?next=/product/${slug}`} className="btn-ghost btn-sm mt-3">
          Sign in to review
        </Link>
      </div>
    );
  }

  return (
    <details className="mt-4 rounded-2xl border border-line/70 bg-white p-4">
      <summary className="cursor-pointer text-[12.5px] font-semibold text-forest">Write a review</summary>
      <form action="/api/reviews" method="post" className="mt-3 space-y-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="next" value={`/product/${slug}#reviews`} />
        <fieldset>
          <legend className="label">Your rating</legend>
          <div className="flex gap-1.5">
            {[5, 4, 3, 2, 1].map((value) => (
              <label key={value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  defaultChecked={value === 5}
                  className="peer sr-only"
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                />
                <span className="block rounded-lg px-1 text-ink/25 peer-checked:text-emerald">
                  <Stars rating={value} size={18} showEmpty={false} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={`title-${productId}`} className="label">
            Headline <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <input id={`title-${productId}`} name="title" className="field" maxLength={90} placeholder="Great for long runs" />
        </div>
        <div>
          <label htmlFor={`body-${productId}`} className="label">
            Your review
          </label>
          <textarea
            id={`body-${productId}`}
            name="body"
            rows={3}
            required
            minLength={10}
            className="field resize-y"
            placeholder="How does it fit? How do you use it?"
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3">
          Submit review
        </button>
        <p className="text-[10.5px] text-ink/40">Reviews are published after a quick moderation check.</p>
      </form>
    </details>
  );
}
