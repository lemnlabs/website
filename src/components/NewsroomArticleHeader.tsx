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
        <p className="newsroom-article-meta text-sm text-muted-foreground">
          <time dateTime={publishedAt}>{formattedDate}</time>
        </p>
      </div>
      <PageTitle title={title} appearance="detail" />
      <p className="description text-muted-foreground">{description}</p>
    </header>
  );
}
