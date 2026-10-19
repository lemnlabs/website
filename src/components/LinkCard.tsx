import { Card, CardHeader } from '@/components/ui/card';

interface Props {
  href: string;
  title: string;
  description: string;
}

export default function LinkCard({ href, title, description }: Props) {
  return (
    <a href={href} className="link-card-link">
      <Card className="h-full">
        <CardHeader>
          <h2 className="link-card-title">
            {title} <span aria-hidden="true">↗</span>
          </h2>
          <p className="link-card-description text-muted-foreground">
            {description}
          </p>
        </CardHeader>
      </Card>
    </a>
  );
}
