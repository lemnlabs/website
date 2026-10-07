const HIGHLIGHT_REGEX = /==(?=\S)(.+?)(?<=\S)==/g;

function splitHighlightText(node) {
  const value = node.value;
  if (!value || !value.includes('==')) return null;

  HIGHLIGHT_REGEX.lastIndex = 0;
  const newNodes = [];
  let lastIndex = 0;
  let match;
  let matched = false;

  while ((match = HIGHLIGHT_REGEX.exec(value)) !== null) {
    matched = true;
    if (match.index > lastIndex) {
      newNodes.push({
        type: 'text',
        value: value.slice(lastIndex, match.index),
      });
    }

    newNodes.push({
      type: 'mark',
      data: {
        hName: 'mark',
        hProperties: { className: ['markdown-highlight'] },
      },
      children: [{ type: 'text', value: match[1] }],
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

function transformTree(node) {
  if (!node.children || !Array.isArray(node.children)) return;

  const nextChildren = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      const splitNodes = splitHighlightText(child);
      if (splitNodes) {
        nextChildren.push(...splitNodes);
      } else {
        nextChildren.push(child);
      }
    } else {
      transformTree(child);
      nextChildren.push(child);
    }
  }

  node.children = nextChildren;
}

export default function remarkObsidianHighlight() {
  return function transform(tree) {
    transformTree(tree);
  };
}
