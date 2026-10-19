import { buttonVariants } from '@/components/ui/button';

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
      {appearance === 'footer' && <span aria-hidden="true">↗</span>}
    </a>
  );
}
