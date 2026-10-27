import Link from 'next/link';

export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="13" fill="#064E3B" />
      <path
        d="M9 27.4c4.6 1.6 9.9 1.4 14.6-.8 3.6-1.7 6.4-4.6 7.6-7.8-3.9 2.3-8.3 3.6-12.4 4.6-3.4.8-6.8 1.3-9.8 4Z"
        fill="#18A978"
      />
      <path
        d="M11 20.6c3.4-.5 6.6-1.6 9.4-3.4 2.6-1.7 4.6-4.1 5.4-6.6-3.2 1.9-6.9 3-10.2 3.7-2 .4-3.9.9-5.4 1.9l.8 4.4Z"
        fill="#DDF5E9"
        fillOpacity="0.92"
      />
      <circle cx="28.6" cy="25.2" r="1.9" fill="#DDF5E9" />
    </svg>
  );
}

export function Logo({
  href = '/',
  tone = 'dark',
  compact = false,
}: {
  href?: string;
  tone?: 'dark' | 'light';
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl"
      aria-label="Zakson — home"
    >
      <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-3" />
      {!compact && (
        <span className="leading-none">
          <span
            className={`block font-display text-[20px] font-extrabold tracking-[-0.04em] ${
              tone === 'light' ? 'text-white' : 'text-forest'
            }`}
          >
            zakson
          </span>
          <span
            className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.26em] ${
              tone === 'light' ? 'text-white/60' : 'text-ink/40'
            }`}
          >
            Jos · Nigeria
          </span>
        </span>
      )}
    </Link>
  );
}
