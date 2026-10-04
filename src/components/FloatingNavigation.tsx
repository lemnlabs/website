import { Link } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

interface Props {
  pathname: string;
  base: string;
}

export default function FloatingNavigation({ pathname, base }: Props) {
  const navigation = [
    { label: '홈', path: '' },
    { label: '프로젝트', path: 'projects/' },
    { label: '블로그', path: 'blog/' },
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
          <Link
            key={href}
            href={href}
            className={buttonVariants({
              variant: 'ghost',
              className: 'floating-navigation__link',
            })}
            aria-current={href === selectedKey ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
