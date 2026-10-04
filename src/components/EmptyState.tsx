import { Card } from '@heroui/react';

interface Props {
  message: string;
}

export default function EmptyState({ message }: Props) {
  return (
    <Card variant="secondary" className="empty-state">
      <Card.Content>{message}</Card.Content>
    </Card>
  );
}
