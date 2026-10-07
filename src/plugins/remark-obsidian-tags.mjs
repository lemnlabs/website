import process from 'node:process';

const TAG_REGEX =
  /(?:^|(?<=\s))#([a-zA-Z\uAC00-\uD7A3][a-zA-Z0-9_\-\uAC00-\uD7A3]*(?:\/[a-zA-Z0-9_\-\uAC00-\uD7A3]+)*)(?=\s|[.,!?;:)]|$)/g;

function splitTagText(node, base) {
  const value = node.value;
  if (!value || !value.includes('#')) return null;

  TAG_REGEX.lastIndex = 0;
  const newNodes = [];
  let lastIndex = 0;
  let match;
  let matched = false;

  while ((match = TAG_REGEX.exec(value)) !== null) {
    matched = true;
    if (match.index > lastIndex) {
      newNodes.push({
        type: 'text',
        value: value.slice(lastIndex, match.index),
      });
    }

    const tag = match[1];
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const targetTag = tag.toLowerCase();

    newNodes.push({
      type: 'link',
      url: `${cleanBase}blog/?tag=${encodeURIComponent(targetTag)}`,
      data: {
        hProperties: {
          className: ['markdown-tag'],
          'data-tag': targetTag,
        },
      },
      children: [{ type: 'text', value: `#${tag}` }],
    });

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

function transformTree(node, base) {
  if (!node.children || !Array.isArray(node.children)) return;

  const nextChildren = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      const splitNodes = splitTagText(child, base);
      if (splitNodes) {
        nextChildren.push(...splitNodes);
      } else {
        nextChildren.push(child);
      }
    } else {
      transformTree(child, base);
      nextChildren.push(child);
    }
  }

  node.children = nextChildren;
}

export default function remarkObsidianTags() {
  return function transform(tree) {
    const base = process.env.BASE_URL ?? '/';
    transformTree(tree, base);
  };
}
