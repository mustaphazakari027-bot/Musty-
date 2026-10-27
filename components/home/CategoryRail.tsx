import Link from 'next/link';
import { RunIcon, SneakerIcon, SparkIcon, TrailIcon, TrainIcon, UserIcon } from '@/components/Icons';

const ITEMS = [
  { href: '/shop', label: 'Popular', icon: SparkIcon, featured: true },
  { href: '/shop?gender=men', label: 'Men', icon: UserIcon },
  { href: '/shop?gender=women', label: 'Women', icon: UserIcon },
  { href: '/shop?category=running-shoes', label: 'Running', icon: RunIcon },
  { href: '/shop?category=training-shoes', label: 'Training', icon: TrainIcon },
  { href: '/shop?category=trail-shoes', label: 'Trail', icon: TrailIcon },
  { href: '/shop?category=lifestyle-sneakers', label: 'Lifestyle', icon: SneakerIcon },
  { href: '/shop?sort=newest', label: 'New', icon: SparkIcon },
];

export function CategoryRail() {
  return (
    <section className="shell mt-8 sm:mt-10" aria-label="Shop by category">
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-3 sm:px-0 lg:grid lg:grid-cols-8">
        {ITEMS.map(({ href, label, icon: Icon, featured }) => (
          <Link
            key={label}
            href={href}
            className={`group flex min-w-[84px] flex-col items-center gap-2 rounded-[22px] px-3 py-3.5 transition-all duration-200 sm:min-w-[92px] ${
              featured
                ? 'bg-forest text-white shadow-card hover:bg-forest-800'
                : 'border border-line/80 bg-white text-forest hover:-translate-y-0.5 hover:shadow-card'
            }`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                featured ? 'bg-emerald text-white' : 'bg-mint-200 text-forest group-hover:bg-mint-300'
              }`}
            >
              <Icon size={19} />
            </span>
            <span className={`text-[11.5px] font-semibold ${featured ? 'text-white' : 'text-ink/75'}`}>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
