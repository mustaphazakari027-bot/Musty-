'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui';

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string | null;
}) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : ['/images/products/ultra-run-pro-1.webp'];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-[28px] border border-line/70 bg-mint-100 sm:rounded-[36px]">
        <div className="pointer-events-none absolute inset-0 opacity-40 soft-grid" aria-hidden />
        {badge && (
          <div className="absolute left-4 top-4 z-10">
            <Badge tone="white">{badge}</Badge>
          </div>
        )}
        <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
          <Image
            key={gallery[active]}
            src={gallery[active]}
            alt={`${name} — view ${active + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2.5" role="tablist" aria-label={`${name} images`}>
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-2xl border bg-mint-100 transition-all ${
                active === i ? 'border-forest ring-2 ring-forest/15' : 'border-line/70 hover:border-forest/30'
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
