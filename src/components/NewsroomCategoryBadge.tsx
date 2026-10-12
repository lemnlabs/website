import { Link } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import {
  getNewsCategoryUrl,
  type NewsCategory,
} from '../data/newsroom-categories';

interface Props {
  category: NewsCategory;
  base: string;
}

export default function NewsroomCategoryBadge({ category, base }: Props) {
  return (
    <Link
      href={getNewsCategoryUrl(category, base)}
      className={buttonVariants({
        variant: 'secondary',
        size: 'sm',
        className: 'newsroom-category-badge',
      })}
    >
      {category}
    </Link>
  );
}
