import { Typography } from '@heroui/react';
import type { ReactNode } from 'react';
import PageTitle from './PageTitle';

interface Props {
  title: string;
  description: string;
  publishedAt: string;
  formattedDate: string;
  // Astro supplies this named slot at render time.
  category?: ReactNode;
}

export default function NewsroomArticleHeader({
  title,
  description,
  publishedAt,
  formattedDate,
  category,
}: Props) {
  return (
    <header className="newsroom-article-header">
      <div className="newsroom-article-meta-group">
        {category}
        <Typography.Paragraph
          size="sm"
          color="muted"
          className="newsroom-article-meta"
        >
          <time dateTime={publishedAt}>{formattedDate}</time>
        </Typography.Paragraph>
      </div>
      <PageTitle title={title} appearance="detail" />
      <Typography.Paragraph color="muted" className="description">
        {description}
      </Typography.Paragraph>
    </header>
  );
}
