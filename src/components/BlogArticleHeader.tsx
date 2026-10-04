import { Typography } from '@heroui/react';
import type { ReactNode } from 'react';
import PageTitle from './PageTitle';

interface Props {
  title: string;
  description: string;
  publishedAt: string;
  formattedDate: string;
  // Astro supplies this named slot at render time.
  tags?: ReactNode;
}

export default function BlogArticleHeader({
  title,
  description,
  publishedAt,
  formattedDate,
  tags,
}: Props) {
  return (
    <header className="blog-article-header">
      <PageTitle title={title} appearance="detail" />
      <Typography.Paragraph size="sm" color="muted" className="blog-post-meta">
        <time dateTime={publishedAt}>{formattedDate}</time>
      </Typography.Paragraph>
      <Typography.Paragraph color="muted" className="description">
        {description}
      </Typography.Paragraph>
      {tags}
    </header>
  );
}
