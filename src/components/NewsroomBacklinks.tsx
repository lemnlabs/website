import { Card, Link, Typography } from '@heroui/react';
import type { BacklinkItem } from '../data/vault';

interface Props {
  backlinks: BacklinkItem[];
}

export default function NewsroomBacklinks({ backlinks }: Props) {
  if (!backlinks || backlinks.length === 0) return null;

  return (
    <section className="newsroom-backlinks" aria-label="연결된 문서">
      <div className="newsroom-backlinks__header">
        <Typography.Heading level={2} className="newsroom-backlinks__title">
          연결된 문서
        </Typography.Heading>
        <span className="newsroom-backlinks__badge">{backlinks.length}</span>
      </div>
      <div className="newsroom-backlinks__grid">
        {backlinks.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            className="newsroom-backlink-card-link"
          >
            <Card className="newsroom-backlink-card">
              <Card.Header>
                <Card.Title render={(props) => <h3 {...props} />}>
                  {item.title}{' '}
                  <span aria-hidden="true" className="newsroom-backlink-arrow">
                    ↗
                  </span>
                </Card.Title>
                {item.description ? (
                  <Card.Description>{item.description}</Card.Description>
                ) : null}
              </Card.Header>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
