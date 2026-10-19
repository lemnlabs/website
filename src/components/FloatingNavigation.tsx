import { buttonVariants } from '@/components/ui/button';

interface Props {
  pathname: string;
  base: string;
}

export default function FloatingNavigation({ pathname, base }: Props) {
  const navigation = [
    { label: '홈', path: '' },
    { label: '프로젝트', path: 'projects/' },
    { label: '뉴스룸', path: 'newsroom/' },
    { label: '소개', path: 'about/' },
  ];
  const selected = navigation.find(({ path }) =>
    path === '' ? pathname === base : pathname.startsWith(`${base}${path}`),
  );
  const selectedKey = `${base}${selected?.path ?? ''}`;

  return (
    <nav className="floating-navigation" aria-label="주 메뉴">
      {navigation.map(({ label, path }) => {
        const href = `${base}${path}`;

        return (
          <a
            key={href}
            href={href}
            className={buttonVariants({
              variant: 'ghost',
              className: 'floating-navigation__link',
            })}
            aria-current={href === selectedKey ? 'page' : undefined}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
