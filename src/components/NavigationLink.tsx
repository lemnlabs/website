import { Link } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

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
          size: appearance === 'footer' ? 'sm' : 'md',
          className: appearance === 'back' ? 'back-link' : undefined,
        });

  return (
    <Link href={href} className={className}>
      {label}
      {appearance === 'footer' && <span aria-hidden="true">↗</span>}
    </Link>
  );
}
