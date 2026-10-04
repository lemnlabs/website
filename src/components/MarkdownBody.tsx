import { Typography } from '@heroui/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function MarkdownBody({ children }: Props) {
  return (
    <Typography.Prose className="markdown-prose">{children}</Typography.Prose>
  );
}
