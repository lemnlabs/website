import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function MarkdownBody({ children }: Props) {
  return <div className="markdown-prose">{children}</div>;
}
