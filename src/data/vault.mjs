import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

const MEDIA_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'avif',
  'mp4',
  'webm',
  'mp3',
  'wav',
  'pdf',
]);

function isMediaFile(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext ? MEDIA_EXTENSIONS.has(ext) : false;
}

function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    return {
      title: '',
      aliases: [],
      publishedAt: undefined,
      description: undefined,
    };
  }

  const fm = fmMatch[1];
  const title = (fm.match(/^title:\s*['"]?(.*?)['"]?\s*$/m)?.[1] ?? '').trim();
  const description = (
    fm.match(/^description:\s*['"]?(.*?)['"]?\s*$/m)?.[1] ?? ''
  ).trim();
  const publishedAt = (
    fm.match(/^publishedAt:\s*['"]?(.*?)['"]?\s*$/m)?.[1] ?? ''
  ).trim();

  const aliases = [];
  const inline = fm.match(/^aliases:\s*\[(.*?)\]/m);
  if (inline) {
    aliases.push(
      ...inline[1]
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean),
    );
  }

  const multiMatch = fm.match(
    /^aliases:\s*\r?\n((?:[ \t]*-[ \t]+[^\r\n]+\r?\n?)+)/m,
  );
  if (multiMatch) {
    const lines = multiMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const item = line
        .replace(/^[ \t]*-[ \t]+/, '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (item) aliases.push(item);
    }
  }

  return {
    title,
    aliases: [...new Set(aliases)],
    publishedAt: publishedAt || undefined,
    description: description || undefined,
  };
}

function extractHeadings(content) {
  const headings = [];
  const matches = content.matchAll(/^#{1,6}\s+(.+)$/gm);
  for (const match of matches) {
    const rawText = match[1].trim();
    const plainText = rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '');
    headings.push({
      depth: match[0].indexOf(' '),
      text: plainText,
      slug: slugifyHeading(plainText),
    });
  }
  return headings;
}

function extractOutgoingLinks(content) {
  const links = [];
  const matches = content.matchAll(/!?\[\[([^\]]+)\]\]/g);
  for (const match of matches) {
    const rawTarget = match[1].split('|')[0].split('#')[0].trim();
    if (rawTarget && !isMediaFile(rawTarget)) {
      links.push(rawTarget);
    }
  }
  return [...new Set(links)];
}

function scanMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      entries.push(...scanMarkdownFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.md')) {
      entries.push(fullPath);
    }
  }
  return entries;
}

let cachedIndex = null;

export function buildVaultIndex(baseDir = process.cwd()) {
  const base = process.env.BASE_URL ?? '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const contentDir = path.join(baseDir, 'src', 'content');

  const allDocuments = [];
  const documents = new Map();
  const backlinks = new Map();

  // 1. Scan blog
  const blogFiles = scanMarkdownFiles(path.join(contentDir, 'blog'));
  for (const filePath of blogFiles) {
    const rel = path.relative(path.join(contentDir, 'blog'), filePath);
    const slug = rel.endsWith('/index.md')
      ? rel.slice(0, -'/index.md'.length)
      : rel.replace(/\.md$/, '');

    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const headings = extractHeadings(content);
    const outgoingLinks = extractOutgoingLinks(content);

    const doc = {
      id: slug,
      collection: 'blog',
      title: fm.title || slug,
      url: `${cleanBase}blog/${slug}/`,
      filePath,
      headings,
      outgoingLinks,
      aliases: fm.aliases,
      publishedAt: fm.publishedAt,
      description: fm.description,
    };
    allDocuments.push(doc);
  }

  // 2. Scan projects
  const projectFiles = scanMarkdownFiles(path.join(contentDir, 'projects'));
  for (const filePath of projectFiles) {
    const slug = path.basename(filePath, '.md');
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const headings = extractHeadings(content);
    const outgoingLinks = extractOutgoingLinks(content);

    const doc = {
      id: slug,
      collection: 'projects',
      title: fm.title || slug,
      url: `${cleanBase}projects/${slug}/`,
      filePath,
      headings,
      outgoingLinks,
      aliases: fm.aliases,
      description: fm.description,
    };
    allDocuments.push(doc);
  }

  // 3. Scan pages
  const pageFiles = scanMarkdownFiles(path.join(contentDir, 'pages'));
  for (const filePath of pageFiles) {
    const slug = path.basename(filePath, '.md');
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const headings = extractHeadings(content);
    const outgoingLinks = extractOutgoingLinks(content);

    const doc = {
      id: slug,
      collection: 'pages',
      title: fm.title || slug,
      url: `${cleanBase}${slug}/`,
      filePath,
      headings,
      outgoingLinks,
      aliases: fm.aliases,
      description: fm.description,
    };
    allDocuments.push(doc);
  }

  // 4. Register lookup keys
  for (const doc of allDocuments) {
    // Exact id & lowercased id
    documents.set(doc.id, doc);
    documents.set(doc.id.toLowerCase(), doc);

    // Exact title & lowercased title
    if (doc.title) {
      documents.set(doc.title, doc);
      documents.set(doc.title.toLowerCase(), doc);
    }

    // Basename
    const basename = path.basename(doc.filePath, '.md');
    documents.set(basename, doc);
    documents.set(basename.toLowerCase(), doc);

    // Aliases
    for (const alias of doc.aliases) {
      documents.set(alias, doc);
      documents.set(alias.toLowerCase(), doc);
    }
  }

  // 5. Calculate backlinks
  for (const source of allDocuments) {
    for (const linkTarget of source.outgoingLinks) {
      const resolved =
        documents.get(linkTarget) ?? documents.get(linkTarget.toLowerCase());
      if (resolved && resolved.id !== source.id) {
        const existing = backlinks.get(resolved.id) ?? [];
        if (!existing.some((item) => item.id === source.id)) {
          existing.push({
            id: source.id,
            title: source.title,
            url: source.url,
            publishedAt: source.publishedAt,
            description: source.description,
          });
          backlinks.set(resolved.id, existing);
        }
      }
    }
  }

  return { documents, allDocuments, backlinks };
}

export function getVaultIndex() {
  if (!cachedIndex) {
    cachedIndex = buildVaultIndex();
  }
  return cachedIndex;
}

export function resolveWikiTarget(target, index = getVaultIndex()) {
  const trimmed = target.trim();
  return (
    index.documents.get(trimmed) ??
    index.documents.get(trimmed.toLowerCase()) ??
    null
  );
}
