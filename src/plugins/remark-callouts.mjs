const typeAliases = new Map([
  ['abstract', 'abstract'],
  ['summary', 'abstract'],
  ['tldr', 'abstract'],
  ['info', 'info'],
  ['todo', 'info'],
  ['note', 'note'],
  ['tip', 'tip'],
  ['hint', 'tip'],
  ['important', 'important'],
  ['success', 'success'],
  ['check', 'success'],
  ['done', 'success'],
  ['question', 'question'],
  ['help', 'question'],
  ['faq', 'question'],
  ['warning', 'warning'],
  ['attention', 'warning'],
  ['caution', 'caution'],
  ['failure', 'failure'],
  ['fail', 'failure'],
  ['missing', 'failure'],
  ['danger', 'danger'],
  ['error', 'danger'],
  ['bug', 'bug'],
  ['example', 'example'],
  ['quote', 'quote'],
  ['cite', 'quote'],
]);

const defaultLabels = new Map([
  ['note', '참고'],
  ['abstract', '요약'],
  ['info', '정보'],
  ['tip', '팁'],
  ['important', '중요'],
  ['success', '완료'],
  ['question', '질문'],
  ['warning', '주의'],
  ['caution', '경고'],
  ['failure', '실패'],
  ['danger', '위험'],
  ['bug', '버그'],
  ['example', '예시'],
  ['quote', '인용'],
]);

function transformCallout(node) {
  const paragraph = node.children[0];
  const first = paragraph?.children?.[0];
  if (paragraph?.type !== 'paragraph' || first?.type !== 'text') return;

  const marker = /^\[!([a-zA-Z]+)\]([+-])?(?:[ \t]+|(?=\n|$))/i.exec(
    first.value,
  );
  if (!marker) return;

  const rawType = marker[1].toLowerCase();
  const canonicalType = typeAliases.get(rawType) ?? rawType;
  const fold = marker[2];
  const isCollapsible = fold === '+' || fold === '-';

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

  const defaultLabel =
    defaultLabels.get(canonicalType) ??
    rawType.charAt(0).toUpperCase() + rawType.slice(1);

  node.data = {
    ...node.data,
    hName: isCollapsible ? 'details' : 'aside',
    hProperties: {
      className: [
        'markdown-callout',
        ...(isCollapsible ? ['markdown-callout--collapsible'] : []),
      ],
      'data-callout': canonicalType,
      ...(fold === '+' ? { open: true } : {}),
    },
  };
  node.children = [
    {
      type: 'paragraph',
      data: {
        hName: isCollapsible ? 'summary' : undefined,
        hProperties: { className: ['markdown-callout__title'] },
      },
      children: [
        {
          type: 'strong',
          children: title.length
            ? title
            : [{ type: 'text', value: defaultLabel }],
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
