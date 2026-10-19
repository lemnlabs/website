import { buttonVariants } from '@/components/ui/button';
import { ArrowUpRightIcon } from 'lucide-react';

interface Props {
  href: string;
  label: string;
  appearance?: 'back' | 'footer' | 'skip';
}

export default function NavigationLink({
  href,
  label,
  appearance = 'back',
}: Props) {
  const className =
    appearance === 'skip'
      ? 'skip-link'
      : buttonVariants({
          variant: 'ghost',
          size: appearance === 'footer' ? 'sm' : 'default',
          className: appearance === 'back' ? 'back-link' : undefined,
        });

  return (
    <a href={href} className={className}>
      {label}
      {appearance === 'footer' && (
        <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
      )}
    </a>
  );
}
