import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { normalizeTag } from './data/blog-tags';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    tags: z
      .array(
        z
          .string()
          .transform(normalizeTag)
          .pipe(z.string().min(1, '빈 태그는 사용할 수 없습니다.')),
      )
      .default([])
      .transform((tags) => [...new Set(tags)]),
    publishedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        );
      }, '유효한 YYYY-MM-DD 날짜를 입력하세요.'),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    order: z.number().int().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
  }),
});

export const collections = { blog, projects, pages };
