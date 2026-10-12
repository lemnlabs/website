export const NEWS_CATEGORIES = ['공지사항', '보도자료', '미디어'] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NewsArticleSummary {
  id: string;
  href: string;
  title: string;
  description: string;
  publishedAt: string;
  formattedDate: string;
  category: NewsCategory;
}

export function isValidCategory(value: string | null): value is NewsCategory {
  return (
    value !== null && (NEWS_CATEGORIES as readonly string[]).includes(value)
  );
}

export function getNewsCategoryUrl(category: NewsCategory, base: string) {
  return `${base}newsroom/?${new URLSearchParams({ category })}`;
}
