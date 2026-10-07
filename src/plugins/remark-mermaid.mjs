function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function remarkMermaid() {
  return function transform(tree) {
    function walk(node, index, parent) {
      if (node.type === 'code' && node.lang?.toLowerCase() === 'mermaid') {
        const rawCode = node.value || '';
        const escapedCode = escapeHtml(rawCode);
        const title = node.meta ? escapeHtml(node.meta) : '';
        const titleAttr = title ? ` data-title="${title}"` : '';

        parent.children[index] = {
          type: 'html',
          value: `<div class="mermaid-diagram" data-mermaid-code="${escapedCode}"${titleAttr}><div class="mermaid-diagram__viewport"><pre class="mermaid">${escapedCode}</pre></div></div>`,
        };
        return;
      }

      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], i, node);
        }
      }
    }

    walk(tree);
  };
}
