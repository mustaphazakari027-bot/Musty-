export type SeedProduct = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  gender: 'men' | 'women' | 'unisex';
  priceKobo: number;
  compareAtKobo?: number;
  badge?: string;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  images: string[];
  colors: string[];
  sizes: string[];
  outOfStock?: string[]; // "color/size" pairs deliberately marked sold out
};

export const CATEGORIES = [
  { slug: 'running-shoes', name: 'Running Shoes', description: 'Daily trainers and race-day shoes built for the Jos altitude.', icon: 'run' },
  { slug: 'training-shoes', name: 'Training Shoes', description: 'Stable, grippy shoes for the gym and functional training.', icon: 'train' },
  { slug: 'trail-shoes', name: 'Trail Shoes', description: 'Grip and protection for Plateau trails and rough roads.', icon: 'trail' },
  { slug: 'lifestyle-sneakers', name: 'Lifestyle Sneakers', description: 'Everyday comfort that works with everything you wear.', icon: 'sneaker' },
];

export const COLORS = [
  { slug: 'mint-white', name: 'Mint / White', hex: '#DDF5E9', filter: 'none', sort: 1 },
  { slug: 'core-black', name: 'Core Black', hex: '#101A17', filter: 'grayscale(1) contrast(1.2) brightness(0.62)', sort: 2 },
  { slug: 'sky-blue', name: 'Sky Blue', hex: '#9CCEF5', filter: 'hue-rotate(150deg) saturate(1.15)', sort: 3 },
  { slug: 'emerald', name: 'Emerald', hex: '#18A978', filter: 'hue-rotate(-25deg) saturate(1.5)', sort: 4 },
  { slug: 'forest', name: 'Forest Green', hex: '#064E3B', filter: 'hue-rotate(-10deg) saturate(1.6) brightness(0.75)', sort: 5 },
  { slug: 'sand', name: 'Sand', hex: '#D9C7A8', filter: 'sepia(0.55) saturate(1.1)', sort: 6 },
  { slug: 'stone-grey', name: 'Stone Grey', hex: '#B9C3BE', filter: 'grayscale(0.85) brightness(1.02)', sort: 7 },
];

const MEN_SIZES = ['6', '7', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'];
const WOMEN_SIZES = ['4', '5', '6', '6.5', '7', '7.5', '8', '9'];

export const SIZES = [
  ...new Set([...MEN_SIZES, ...WOMEN_SIZES]),
].sort((a, b) => Number(a) - Number(b)).map((label, i) => ({ label, sort: i + 1 }));

export const PRODUCTS: SeedProduct[] = [
  {
    slug: 'ultra-run-pro',
    name: 'Ultra Run Pro',
    subtitle: "Men's Running Shoes",
    description:
      'Built for speed and endurance. The Ultra Run Pro pairs a breathable engineered knit upper with a responsive nitrogen-infused foam midsole, delivering superior cushioning, ventilation and support for every stride — from a 5K around Jos to a full marathon.',
    categorySlug: 'running-shoes',
    gender: 'men',
    priceKobo: 15_999_000,
    compareAtKobo: 18_999_000,
    badge: 'Best seller',
    featured: true,
    bestSeller: true,
    isNew: false,
    images: [
      '/images/products/ultra-run-pro-1.webp',
      '/images/products/ultra-run-pro-2.webp',
      '/images/products/ultra-run-pro-3.webp',
    ],
    colors: ['mint-white', 'core-black', 'sky-blue', 'emerald'],
    sizes: MEN_SIZES,
    outOfStock: ['core-black/12', 'sky-blue/6'],
  },
  {
    slug: 'velocity-boost-2',
    name: 'Velocity Boost 2.0',
    subtitle: "Men's Running Shoes",
    description:
      'A fast daily trainer with a rocker geometry that keeps your turnover smooth. The dual-density midsole absorbs impact on hard roads while the carbon-rubber outsole grips reliably through the rainy season.',
    categorySlug: 'running-shoes',
    gender: 'men',
    priceKobo: 14_999_000,
    compareAtKobo: 17_499_000,
    badge: 'Trending',
    featured: true,
    bestSeller: true,
    images: ['/images/products/velocity-boost-1.webp'],
    colors: ['core-black', 'emerald', 'stone-grey'],
    sizes: MEN_SIZES,
  },
  {
    slug: 'aero-stride',
    name: 'Aero Stride',
    subtitle: "Women's Running Shoes",
    description:
      'Light, airy and soft underfoot. The Aero Stride is tuned for a woman’s stride with a narrower heel, a plush collar and a foam midsole that stays springy kilometre after kilometre.',
    categorySlug: 'running-shoes',
    gender: 'women',
    priceKobo: 13_999_000,
    badge: 'New',
    featured: true,
    isNew: true,
    images: ['/images/products/aero-stride-1.webp'],
    colors: ['mint-white', 'sand', 'sky-blue'],
    sizes: WOMEN_SIZES,
  },
  {
    slug: 'cloudtrail-gtx',
    name: 'Cloudtrail GTX',
    subtitle: "Unisex Trail Shoes",
    description:
      'Made for Plateau trails and rough township roads. A water-repellent ripstop upper, protective toe bumper and 5 mm multi-directional lugs keep you planted on loose stone, mud and wet laterite.',
    categorySlug: 'trail-shoes',
    gender: 'unisex',
    priceKobo: 17_499_000,
    featured: true,
    images: ['/images/products/cloudtrail-1.webp'],
    colors: ['forest', 'stone-grey', 'core-black'],
    sizes: MEN_SIZES,
    outOfStock: ['forest/10'],
  },
  {
    slug: 'tempo-trainer',
    name: 'Tempo Trainer',
    subtitle: "Men's Training Shoes",
    description:
      'A stable, wide-based trainer for the gym floor and court. Flat, grippy outsole for lifts and agility work, with a reinforced cage that holds your foot through lateral movement.',
    categorySlug: 'training-shoes',
    gender: 'men',
    priceKobo: 11_999_000,
    compareAtKobo: 13_999_000,
    bestSeller: true,
    images: ['/images/products/tempo-trainer-1.webp'],
    colors: ['core-black', 'forest', 'stone-grey'],
    sizes: MEN_SIZES,
  },
  {
    slug: 'everyday-court',
    name: 'Everyday Court',
    subtitle: 'Unisex Lifestyle Sneakers',
    description:
      'A clean leather sneaker that goes with everything — jeans, chinos, office casual. Cushioned insole, durable stitched sole and an emerald heel tab that quietly says Zakson.',
    categorySlug: 'lifestyle-sneakers',
    gender: 'unisex',
    priceKobo: 9_499_000,
    featured: true,
    images: ['/images/products/everyday-court-1.webp'],
    colors: ['mint-white', 'core-black', 'sand'],
    sizes: MEN_SIZES,
  },
  {
    slug: 'pace-elite-carbon',
    name: 'Pace Elite Carbon',
    subtitle: "Unisex Racing Shoes",
    description:
      'Our fastest shoe. A full-length carbon plate sits between two layers of super-critical foam to return energy on race day. Designed for personal bests — not for daily mileage.',
    categorySlug: 'running-shoes',
    gender: 'unisex',
    priceKobo: 22_999_000,
    badge: 'Race day',
    isNew: true,
    images: ['/images/products/pace-elite-1.webp'],
    colors: ['emerald', 'core-black'],
    sizes: MEN_SIZES,
    outOfStock: ['emerald/6', 'emerald/12'],
  },
  {
    slug: 'stride-lite',
    name: 'Stride Lite',
    subtitle: "Women's Lifestyle Sneakers",
    description:
      'Featherweight everyday sneakers in soft suede and mesh. Slip them on for lectures, market runs or a walk along the ridge — the memory-foam footbed keeps you comfortable all day.',
    categorySlug: 'lifestyle-sneakers',
    gender: 'women',
    priceKobo: 8_999_000,
    compareAtKobo: 10_499_000,
    badge: 'New',
    isNew: true,
    bestSeller: true,
    images: ['/images/products/stride-lite-1.webp'],
    colors: ['mint-white', 'sand', 'stone-grey'],
    sizes: WOMEN_SIZES,
  },
];

export const DELIVERY_ZONES = [
  { name: 'Jos North (Terminus & central Jos)', state: 'Plateau', feeKobo: 150_000, eta: 'Same day – next working day', sort: 1 },
  { name: 'Jos South (Bukuru)', state: 'Plateau', feeKobo: 200_000, eta: '1–2 working days', sort: 2 },
  { name: 'Other Plateau State areas', state: 'Plateau', feeKobo: 250_000, eta: '2–3 working days', sort: 3 },
  { name: 'Abuja (FCT)', state: 'FCT', feeKobo: 450_000, eta: '2–3 working days', sort: 4 },
  { name: 'Lagos', state: 'Lagos', feeKobo: 500_000, eta: '2–4 working days', sort: 5 },
  { name: 'Other states (nationwide courier)', state: 'Other', feeKobo: 550_000, eta: '3–5 working days', sort: 6 },
];

export const COUPONS = [
  {
    code: 'ZAKSON10',
    description: '10% off orders from ₦120,000',
    type: 'percent' as const,
    value: 10,
    minSubtotalKobo: 12_000_000,
    maxUses: 500,
  },
  {
    code: 'STRIDE5',
    description: '₦5,000 off orders from ₦80,000',
    type: 'fixed' as const,
    value: 5000,
    minSubtotalKobo: 8_000_000,
    maxUses: null,
  },
];

/** Sample reviews — flagged `is_sample` in the database so they are easy to remove. */
export const SAMPLE_REVIEWS: Record<string, { author: string; rating: number; title: string; body: string; daysAgo: number }[]> = {
  'ultra-run-pro': [
    { author: 'Ibrahim S.', rating: 5, title: 'Great for Jos hills', body: 'I run the hilly roads around old Jos three times a week. Cushioning is excellent and my knees feel much better than with my previous pair. Delivery to Terminus took one day.', daysAgo: 12 },
    { author: 'Grace A.', rating: 4, title: 'Light and breathable', body: 'Very light on the foot and breathable in the heat. I sized half up as advised and the fit is perfect.', daysAgo: 26 },
    { author: 'Musa D.', rating: 5, title: 'Worth the price', body: 'Bought for marathon training. Two months in, no signs of wear on the outsole.', daysAgo: 41 },
  ],
  'velocity-boost-2': [
    { author: 'Peter O.', rating: 4, title: 'Fast trainer', body: 'The rocker shape really helps my turnover. Grip is good on wet tar too.', daysAgo: 9 },
    { author: 'Samuel K.', rating: 5, title: 'Comfortable from day one', body: 'No break-in needed. Used it for a 10K the day after delivery.', daysAgo: 33 },
  ],
  'aero-stride': [
    { author: 'Blessing T.', rating: 5, title: 'So light', body: 'Feels like running on air. The mint colour is exactly as shown on the site.', daysAgo: 6 },
    { author: 'Hauwa M.', rating: 4, title: 'Lovely fit', body: 'True to size for me and the heel is snug without rubbing.', daysAgo: 20 },
  ],
  'cloudtrail-gtx': [
    { author: 'Daniel E.', rating: 5, title: 'Handles the rainy season', body: 'Took these on the trails near Shere Hills. Feet stayed dry and the grip on wet rock is confidence-inspiring.', daysAgo: 17 },
  ],
  'everyday-court': [
    { author: 'Aisha Y.', rating: 5, title: 'Clean and versatile', body: 'Wear these to the office and on weekends. Easy to wipe clean.', daysAgo: 14 },
    { author: 'Tunde B.', rating: 4, title: 'Good everyday shoe', body: 'Comfortable and well made. Would have liked a size 13 available.', daysAgo: 30 },
  ],
};
