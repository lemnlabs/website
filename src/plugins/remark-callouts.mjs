const labels = new Map([
  ['info', '정보'],
  ['note', '참고'],
  ['tip', '팁'],
  ['important', '중요'],
  ['warning', '주의'],
  ['caution', '경고'],
]);

function transformCallout(node) {
  const paragraph = node.children[0];
  const first = paragraph?.children?.[0];
  if (paragraph?.type !== 'paragraph' || first?.type !== 'text') return;

  const marker =
    /^\[!(info|note|tip|important|warning|caution)\](?:[ \t]+|(?=\n|$))/i.exec(
      first.value,
    );
  if (!marker) return;

  const type = marker[1].toLowerCase();
  const inline = [
    { ...first, value: first.value.slice(marker[0].length) },
    ...paragraph.children.slice(1),
  ];
  const title = [];
  const body = [];
  let inBody = false;

  // Split only the marker line; retain inline Markdown nodes in both parts.
  for (const child of inline) {
    const newline = child.type === 'text' ? child.value.indexOf('\n') : -1;
    if (!inBody && (newline !== -1 || child.type === 'break')) {
      if (newline > 0) {
        title.push({ ...child, value: child.value.slice(0, newline) });
      }
      if (newline !== -1 && child.value.slice(newline + 1)) {
        body.push({ ...child, value: child.value.slice(newline + 1) });
      }
      inBody = true;
    } else if (child.type !== 'text' || child.value) {
      (inBody ? body : title).push(child);
    }
  }

  node.data = {
    ...node.data,
    hName: 'aside',
    hProperties: { className: ['markdown-callout'], 'data-callout': type },
  };
  node.children = [
    {
      type: 'paragraph',
      data: { hProperties: { className: ['markdown-callout__title'] } },
      children: [
        {
          type: 'strong',
          children: title.length
            ? title
            : [{ type: 'text', value: labels.get(type) }],
        },
      ],
    },
    ...(body.length ? [{ ...paragraph, children: body }] : []),
    ...node.children.slice(1),
  ];
}

export default function remarkCallouts() {
  return function transform(tree) {
    function walk(node) {
      if (node.type === 'blockquote') transformCallout(node);
      for (const child of node.children ?? []) walk(child);
    }
    walk(tree);
  };
}
