import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getVaultIndex, resolveWikiTarget } from '../data/vault.mjs';

const EMBED_REGEX = /!\[\[([^\]]+)\]\]/g;

const MEDIA_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'avif',
  'ico',
  'bmp',
]);

function isMediaFile(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? MEDIA_EXTENSIONS.has(ext) : false;
}

function resolveImagePath(filename, filePath) {
  const currentDir = filePath ? path.dirname(filePath) : null;
  if (currentDir && fs.existsSync(path.join(currentDir, filename))) {
    return `./${filename}`;
  }

  const base = process.env.BASE_URL ?? '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, 'public', filename))) {
    return `${cleanBase}${filename}`;
  }
  if (fs.existsSync(path.join(cwd, 'public', 'images', filename))) {
    return `${cleanBase}images/${filename}`;
  }

  return `./${filename}`;
}

function parseEmbedOptions(options) {
  let width;
  let height;
  let alt;

  for (const opt of options) {
    const dimMatch = /^(\d+)(?:x(\d+))?$/.exec(opt);
    if (dimMatch) {
      width = dimMatch[1];
      height = dimMatch[2];
    } else {
      alt = opt;
    }
  }

  return { width, height, alt };
}

export default function remarkObsidianEmbed() {
  const parser = this;
  return function transform(tree, file) {
    const index = getVaultIndex();
    const currentFilePath = file?.history?.[0] || file?.path || null;
    const activeEmbeds = new Set();

    function transformChildren(children, depth = 0) {
      if (!Array.isArray(children)) return children;

      const nextChildren = [];

      for (const child of children) {
        if (child.type === 'text') {
          const value = child.value;
          if (!value || !value.includes('![[')) {
            nextChildren.push(child);
            continue;
          }

          EMBED_REGEX.lastIndex = 0;
          let lastIndex = 0;
          let match;
          let matched = false;

          while ((match = EMBED_REGEX.exec(value)) !== null) {
            matched = true;
            if (match.index > lastIndex) {
              nextChildren.push({
                type: 'text',
                value: value.slice(lastIndex, match.index),
              });
            }

            const inner = match[1].trim();
            const parts = inner.split('|').map((s) => s.trim());
            const target = parts[0];
            const options = parts.slice(1);

            if (isMediaFile(target)) {
              // 1. Image Embed
              const { width, height, alt } = parseEmbedOptions(options);
              const imageUrl = resolveImagePath(target, currentFilePath);

              nextChildren.push({
                type: 'image',
                url: imageUrl,
                alt: alt || target,
                data: {
                  hProperties: {
                    'data-embed': 'image',
                    ...(width ? { width } : {}),
                    ...(height ? { height } : {}),
                    ...(width
                      ? {
                          style: `max-width: ${width}px; width: 100%; height: auto;`,
                        }
                      : {}),
                  },
                },
              });
            } else {
              // 2. Note Embed (Transclusion)
              const doc = resolveWikiTarget(target, index);
              if (!doc) {
                nextChildren.push({
                  type: 'container',
                  data: {
                    hName: 'div',
                    hProperties: {
                      className: ['markdown-embed-note', 'is-unresolved'],
                      'data-embed-target': target,
                    },
                  },
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: `⚠️ 포함할 문서를 찾을 수 없습니다: ${target}`,
                        },
                      ],
                    },
                  ],
                });
              } else if (activeEmbeds.has(doc.id) || depth >= 2) {
                // Prevent cyclic transclusion or excessive nesting
                nextChildren.push({
                  type: 'container',
                  data: {
                    hName: 'div',
                    hProperties: {
                      className: ['markdown-embed-note', 'is-cycle'],
                      'data-embed-target': doc.id,
                    },
                  },
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: `⚠️ 순환 참조 방지: ${doc.title}`,
                        },
                      ],
                    },
                  ],
                });
              } else {
                activeEmbeds.add(doc.id);
                try {
                  const rawDoc = fs.readFileSync(doc.filePath, 'utf8');
                  const body = rawDoc
                    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
                    .trim();
                  const parsed = parser.parse(body);

                  // Process embedded tree recursively with incremented depth
                  const embeddedChildren = transformChildren(
                    parsed.children,
                    depth + 1,
                  );

                  nextChildren.push({
                    type: 'container',
                    data: {
                      hName: 'div',
                      hProperties: {
                        className: ['markdown-embed-note'],
                        'data-embed-target': doc.id,
                      },
                    },
                    children: [
                      {
                        type: 'paragraph',
                        data: {
                          hName: 'div',
                          hProperties: {
                            className: ['markdown-embed-note__header'],
                          },
                        },
                        children: [
                          {
                            type: 'link',
                            url: doc.url,
                            data: {
                              hProperties: {
                                className: ['markdown-embed-note__link'],
                              },
                            },
                            children: [
                              {
                                type: 'strong',
                                children: [{ type: 'text', value: doc.title }],
                              },
                            ],
                          },
                        ],
                      },
                      ...embeddedChildren,
                    ],
                  });
                } finally {
                  activeEmbeds.delete(doc.id);
                }
              }
            }

            lastIndex = match.index + match[0].length;
          }

          if (!matched) {
            nextChildren.push(child);
          } else if (lastIndex < value.length) {
            nextChildren.push({
              type: 'text',
              value: value.slice(lastIndex),
            });
          }
        } else {
          if (child.children) {
            child.children = transformChildren(child.children, depth);
          }
          nextChildren.push(child);
        }
      }

      return nextChildren;
    }

    tree.children = transformChildren(tree.children, 0);
  };
}
