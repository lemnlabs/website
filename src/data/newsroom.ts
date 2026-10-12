import { getCollection, type CollectionEntry } from 'astro:content';

export async function getNewsArticles() {
  const articles = await getCollection('newsroom');
  return articles.sort(
    (a, b) =>
      b.data.publishedAt.localeCompare(a.data.publishedAt) ||
      a.id.localeCompare(b.id),
  );
}

export function getNewsArticleUrl(article: CollectionEntry<'newsroom'>) {
  const slug = article.id.split('/').map(encodeURIComponent).join('/');
  return `${import.meta.env.BASE_URL}newsroom/${slug}/`;
}

export function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
