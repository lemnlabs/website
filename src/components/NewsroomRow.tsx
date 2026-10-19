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
        <p className="newsroom-article-meta text-sm text-muted-foreground">
          <time dateTime={publishedAt}>{formattedDate}</time>
        </p>
      </div>
      <h2>
        <a href={href} className="content-link">
          {title}
        </a>
      </h2>
      <p className="content-description text-muted-foreground">{description}</p>
    </article>
  );
}
