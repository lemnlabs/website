import { Card, Link } from '@heroui/react';

interface Props {
  href: string;
  title: string;
  description: string;
}

export default function LinkCard({ href, title, description }: Props) {
  return (
    <Link href={href} className="link-card-link">
      <Card className="link-card">
        <Card.Header>
          <Card.Title render={(props) => <h2 {...props} />}>
            {title} <span aria-hidden="true">↗</span>
          </Card.Title>
          <Card.Description>{description}</Card.Description>
        </Card.Header>
      </Card>
    </Link>
  );
}
