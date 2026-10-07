import {
  getVaultIndex,
  resolveWikiTarget,
  slugifyHeading,
} from '../data/vault.mjs';

const WIKILINK_REGEX = /(?<!!)\[\[([^\]]+)\]\]/g;

function splitWikiLinkText(node, index) {
  const value = node.value;
  if (!value || !value.includes('[[')) return null;

  WIKILINK_REGEX.lastIndex = 0;
  const newNodes = [];
  let lastIndex = 0;
  let match;
  let matched = false;

  while ((match = WIKILINK_REGEX.exec(value)) !== null) {
    matched = true;
    if (match.index > lastIndex) {
      newNodes.push({
        type: 'text',
        value: value.slice(lastIndex, match.index),
      });
    }

    const inner = match[1].trim();
    const [rawTarget, aliasPart] = inner.split('|');
    const alias = aliasPart?.trim();
    const [noteTargetRaw, headingPart] = rawTarget.split('#');
    const noteTarget = noteTargetRaw.trim();
    const heading = headingPart?.trim();

    // 1. Same-page heading link: [[#Heading]]
    if (!noteTarget) {
      const anchor = heading ? slugifyHeading(heading) : '';
      const label = alias || heading || '맨 위로';
      newNodes.push({
        type: 'link',
        url: `#${anchor}`,
        data: {
          hProperties: {
            className: ['wiki-link', 'wiki-link--heading'],
          },
        },
        children: [{ type: 'text', value: label }],
      });
    } else {
      // 2. Cross-document link: [[Note]] or [[Note#Heading]]
      const doc = resolveWikiTarget(noteTarget, index);
      if (doc) {
        const anchor = heading ? `#${slugifyHeading(heading)}` : '';
        const href = `${doc.url}${anchor}`;
        const label =
          alias || (heading ? `${doc.title} > ${heading}` : doc.title);

        newNodes.push({
          type: 'link',
          url: href,
          data: {
            hProperties: {
              className: ['wiki-link'],
              'data-wiki-target': doc.id,
            },
          },
          children: [{ type: 'text', value: label }],
        });
      } else {
        // 3. Unresolved link
        const label =
          alias || (heading ? `${noteTarget} > ${heading}` : noteTarget);
        newNodes.push({
          type: 'link',
          url: 'javascript:void(0)',
          data: {
            hProperties: {
              className: ['wiki-link', 'is-unresolved'],
              'data-wiki-target': noteTarget,
              title: '아직 작성되지 않은 문서입니다.',
            },
          },
          children: [{ type: 'text', value: label }],
        });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (!matched) return null;

  if (lastIndex < value.length) {
    newNodes.push({
      type: 'text',
      value: value.slice(lastIndex),
    });
  }

  return newNodes;
}

function transformTree(node, index) {
  if (!node.children || !Array.isArray(node.children)) return;

  const nextChildren = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      const splitNodes = splitWikiLinkText(child, index);
      if (splitNodes) {
        nextChildren.push(...splitNodes);
      } else {
        nextChildren.push(child);
      }
    } else {
      transformTree(child, index);
      nextChildren.push(child);
    }
  }

  node.children = nextChildren;
}

export default function remarkObsidianWikiLink() {
  return function transform(tree) {
    const index = getVaultIndex();
    transformTree(tree, index);
  };
}
