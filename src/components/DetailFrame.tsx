import type { ReactNode } from 'react';

interface Props {
  // Astro supplies named slots at render time, outside JSX prop checking.
  backLink?: ReactNode;
  header?: ReactNode;
  toc?: ReactNode;
  hasToc?: boolean;
  children: ReactNode;
}

export default function DetailFrame({
  backLink,
  header,
  toc,
  hasToc,
  children,
}: Props) {
  const showToc = Boolean(hasToc && toc);

  if (!showToc) {
    return (
      <article className="detail-content">
        {backLink}
        {header}
        {children}
      </article>
    );
  }

  return (
    <>
      <article className="detail-content">
        {backLink}
        {header}
        {children}
      </article>
      {toc}
    </>
  );
}
