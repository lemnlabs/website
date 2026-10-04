import { Link } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

interface Props {
  href: string;
  label: string;
}

export default function DetailBackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className={buttonVariants({
        variant: 'tertiary',
        className: 'detail-back-link',
      })}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="m10 3-5 5 5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
