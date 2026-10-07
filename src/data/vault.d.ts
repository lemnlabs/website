export interface DocumentHeading {
  depth: number;
  text: string;
  slug: string;
}

export interface DocumentMeta {
  id: string;
  collection: 'blog' | 'projects' | 'pages';
  title: string;
  url: string;
  filePath: string;
  headings: DocumentHeading[];
  outgoingLinks: string[];
  aliases: string[];
  publishedAt?: string;
  description?: string;
}

export interface BacklinkItem {
  id: string;
  title: string;
  url: string;
  publishedAt?: string;
  description?: string;
}

export interface VaultIndex {
  documents: Map<string, DocumentMeta>;
  allDocuments: DocumentMeta[];
  backlinks: Map<string, BacklinkItem[]>;
}

export function slugifyHeading(text: string): string;

export function buildVaultIndex(baseDir?: string): VaultIndex;

export function getVaultIndex(): VaultIndex;

export function resolveWikiTarget(
  target: string,
  index?: VaultIndex,
): DocumentMeta | null;
