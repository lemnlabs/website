import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    <a
      href={getNewsCategoryUrl(category, base)}
      className={cn(
        buttonVariants({
          variant: 'secondary',
        }),
        'rounded-full newsroom-category-badge',
      )}
    >
      {category}
    </a>
  );
}
