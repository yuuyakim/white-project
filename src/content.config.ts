import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const menu = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/menu' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      price: z.number().int().positive(),
      description: z.string(),
      image: image(),
      season: z.enum(['all', 'spring', 'summer', 'autumn', 'winter']),
      available: z.boolean().default(true),
      order: z.number().int().default(100),
    }),
});

const news = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/news',
    // 2026-06-01-open.md → id "open"
    generateId: ({ entry }) => entry.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['休業', '新メニュー', '出店情報', 'その他']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { menu, news };
