import { Link } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import { getTagUrl } from '../data/blog-tags';

interface Props {
  tags: string[];
  base: string;
}

export default function BlogTags({ tags, base }: Props) {
  if (tags.length === 0) return null;

  return (
    <ul className="blog-tags" aria-label="글 태그">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={getTagUrl(tag, base)}
            className={buttonVariants({
              variant: 'secondary',
              size: 'sm',
              className: 'blog-tag-link',
            })}
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
