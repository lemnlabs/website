import { Link, Typography } from '@heroui/react';
import type { BlogPostSummary } from '../data/blog-tags';
import BlogTags from './BlogTags';

interface Props extends BlogPostSummary {
  base: string;
}

export default function BlogPostRow({
  href,
  title,
  description,
  publishedAt,
  formattedDate,
  tags,
  base,
}: Props) {
  return (
    <article className="content-row">
      <Typography.Heading level={2}>
        <Link href={href} className="content-link">
          {title}
        </Link>
      </Typography.Heading>
      <Typography.Paragraph color="muted" className="content-description">
        {description}
      </Typography.Paragraph>
      <Typography.Paragraph size="sm" color="muted" className="blog-post-meta">
        <time dateTime={publishedAt}>{formattedDate}</time>
      </Typography.Paragraph>
      <BlogTags tags={tags} base={base} />
    </article>
  );
}
