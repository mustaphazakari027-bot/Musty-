import Link from 'next/link';
import type { ReactNode } from 'react';
import { StarIcon } from '@/components/Icons';
import { discountPercent, formatNaira } from '@/lib/pricing.mjs';

export function Stars({ rating, size = 14, showEmpty = true }: { rating: number; size?: number; showEmpty?: boolean }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (!showEmpty && i > rounded) return null;
        return (
          <StarIcon
            key={i}
            size={size}
            filled={i <= rounded}
            className={i <= rounded ? 'text-emerald' : 'text-ink/20'}
          />
        );
      })}
    </span>
  );
}

export function Price({
  priceKobo,
  compareAtKobo,
  size = 'md',
}: {
  priceKobo: number;
  compareAtKobo?: number | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const off = discountPercent(priceKobo, compareAtKobo ?? null);
  const sizes = {
    sm: 'text-[15px]',
    md: 'text-lg',
    lg: 'text-[30px] sm:text-[34px]',
  }[size];
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-display font-extrabold tracking-[-0.03em] text-forest ${sizes}`}>
        {formatNaira(priceKobo)}
      </span>
      {off > 0 && (
        <>
          <span className="text-xs font-medium text-ink/40 line-through">{formatNaira(compareAtKobo!)}</span>
          <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald">
            -{off}%
          </span>
        </>
      )}
    </span>
  );
}

export function Badge({
  children,
  tone = 'emerald',
}: {
  children: ReactNode;
  tone?: 'emerald' | 'forest' | 'white' | 'muted';
}) {
  const tones = {
    emerald: 'bg-emerald text-white',
    forest: 'bg-forest text-white',
    white: 'bg-white/90 text-forest backdrop-blur',
    muted: 'bg-mist text-ink/70',
  }[tone];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.06em] sm:text-[10px] sm:tracking-[0.08em] ${tones}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = '',
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        align === 'center' ? 'sm:flex-col sm:items-center sm:text-center' : ''
      } ${className}`}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-[26px] font-extrabold leading-tight sm:text-[34px]">{title}</h2>
        {description && <p className="mt-2.5 text-sm leading-relaxed text-ink/55 sm:text-[15px]">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-forest hover:text-emerald"
        >
          {action.label}
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </Link>
      )}
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-mint-200 text-forest">{icon}</div>}
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="max-w-md text-sm text-ink/55">{description}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  const tone =
    {
      paid: 'bg-emerald/12 text-emerald',
      pending: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-600',
      refunded: 'bg-ink/10 text-ink/70',
      delivered: 'bg-emerald/12 text-emerald',
      cancelled: 'bg-red-100 text-red-600',
    }[status] ?? 'bg-mist text-ink/70';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
