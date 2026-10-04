import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPosts() {
  const posts = await getCollection('blog');
  return posts.sort(
    (a, b) =>
      b.data.publishedAt.localeCompare(a.data.publishedAt) ||
      a.id.localeCompare(b.id),
  );
}

export function getPostUrl(post: CollectionEntry<'blog'>) {
  const slug = post.id.split('/').map(encodeURIComponent).join('/');
  return `${import.meta.env.BASE_URL}blog/${slug}/`;
}

export function formatPostDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
