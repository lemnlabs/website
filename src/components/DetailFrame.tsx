import type { ReactNode } from 'react';

interface Props {
  // Astro supplies named slots at render time, outside JSX prop checking.
  backLink?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

export default function DetailFrame({ backLink, header, children }: Props) {
  return (
    <article className="detail-content">
      {backLink}
      {header}
      {children}
    </article>
  );
}
