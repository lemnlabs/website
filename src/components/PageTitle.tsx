interface Props {
  title: string;
  appearance: 'page' | 'detail';
}

export default function PageTitle({ title, appearance }: Props) {
  return (
    <h1 className={appearance === 'page' ? 'page-title' : undefined}>
      {title}
    </h1>
  );
}
