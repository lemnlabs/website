import { Typography } from '@heroui/react';

interface Props {
  title: string;
  appearance: 'page' | 'detail';
}

export default function PageTitle({ title, appearance }: Props) {
  return (
    <Typography.Heading
      level={1}
      className={appearance === 'page' ? 'page-title' : undefined}
    >
      {title}
    </Typography.Heading>
  );
}
