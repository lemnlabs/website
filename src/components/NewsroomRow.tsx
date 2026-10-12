import { Link, Typography } from '@heroui/react';
import type { NewsArticleSummary } from '../data/newsroom-categories';
import NewsroomCategoryBadge from './NewsroomCategoryBadge';

interface Props extends NewsArticleSummary {
  base: string;
}

export default function NewsroomRow({
  href,
  title,
  description,
  publishedAt,
  formattedDate,
  category,
  base,
}: Props) {
  return (
    <article className="content-row">
      <div className="newsroom-article-meta-group">
        <NewsroomCategoryBadge category={category} base={base} />
        <Typography.Paragraph
          size="sm"
          color="muted"
          className="newsroom-article-meta"
        >
          <time dateTime={publishedAt}>{formattedDate}</time>
        </Typography.Paragraph>
      </div>
      <Typography.Heading level={2}>
        <Link href={href} className="content-link">
          {title}
        </Link>
      </Typography.Heading>
      <Typography.Paragraph color="muted" className="content-description">
        {description}
      </Typography.Paragraph>
    </article>
  );
}
