export interface BlogPostSummary {
  id: string;
  href: string;
  title: string;
  description: string;
  publishedAt: string;
  formattedDate: string;
  tags: string[];
}

export function normalizeTag(tag: string) {
  return tag.trim().normalize('NFC').toLowerCase();
}

export function getTagUrl(tag: string, base: string) {
  return `${base}blog/?${new URLSearchParams({ tag: normalizeTag(tag) })}`;
}
