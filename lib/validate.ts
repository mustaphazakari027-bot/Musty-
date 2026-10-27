import { z } from 'zod';
import { isValidNigerianPhone, normalisePhone } from '@/lib/pricing.mjs';

const phone = z
  .string()
  .trim()
  .refine((v) => isValidNigerianPhone(v), 'Enter a valid Nigerian phone number (e.g. 09034422971)')
  .transform(normalisePhone);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: phone.optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  phone,
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  address: z.string().trim().min(6, 'Enter your delivery address').max(200),
  state: z.string().trim().min(2, 'Select your state'),
  city: z.string().trim().min(2, 'Enter your city or town'),
  landmark: z.string().trim().max(160).optional().or(z.literal('')),
  instructions: z.string().trim().max(400).optional().or(z.literal('')),
  zoneId: z.coerce.number().int().positive('Choose a delivery area'),
});

export const cartAddSchema = z.object({
  productId: z.coerce.number().int().positive(),
  colorSlug: z.string().min(1, 'Choose a colour'),
  sizeLabel: z.string().min(1, 'Choose a size'),
  qty: z.coerce.number().int().min(1).max(10).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  qty: z.coerce.number().int().min(1).max(10).optional(),
  sizeLabel: z.string().min(1).optional(),
  colorSlug: z.string().min(1).optional(),
});

export const couponSchema = z.object({
  code: z.string().trim().max(40).optional().nullable(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: phone.optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'Enter a subject').max(120),
  message: z.string().trim().min(10, 'Tell us a little more (10+ characters)').max(2000),
});

export const reviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(90).optional().or(z.literal('')),
  body: z.string().trim().min(10, 'Write at least 10 characters').max(1200),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal('')),
  fullName: z.string().trim().min(2).max(80),
  phone,
  address: z.string().trim().min(6).max(200),
  state: z.string().trim().min(2),
  city: z.string().trim().min(2),
  landmark: z.string().trim().max(160).optional().or(z.literal('')),
  instructions: z.string().trim().max(400).optional().or(z.literal('')),
  isDefault: z.coerce.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes only'),
  subtitle: z.string().trim().max(120).optional().or(z.literal('')),
  description: z.string().trim().min(10).max(4000),
  categoryId: z.coerce.number().int().positive(),
  gender: z.enum(['men', 'women', 'unisex']),
  priceKobo: z.coerce.number().int().min(1000),
  compareAtKobo: z.coerce.number().int().min(0).optional().nullable(),
  badge: z.string().trim().max(30).optional().or(z.literal('')),
  isFeatured: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  images: z.array(z.string().trim().min(1)).max(8).optional(),
  colors: z.array(z.string().min(1)).min(1, 'Select at least one colour'),
  sizes: z.array(z.string().min(1)).min(1, 'Select at least one size'),
});

export function zodMessage(error: z.ZodError) {
  const first = error.issues[0];
  return first?.message ?? 'Please check the form and try again.';
}

export function fieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((i) => [i.path.join('.'), i.message]));
}
