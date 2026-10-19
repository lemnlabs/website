import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BacklinkItem } from '../data/vault';

interface Props {
  backlinks: BacklinkItem[];
}

export default function NewsroomBacklinks({ backlinks }: Props) {
  if (!backlinks || backlinks.length === 0) return null;

  return (
    <section className="newsroom-backlinks" aria-label="연결된 문서">
      <div className="newsroom-backlinks__header">
        <h2 className="newsroom-backlinks__title">연결된 문서</h2>
        <span className="newsroom-backlinks__badge">{backlinks.length}</span>
      </div>
      <div className="newsroom-backlinks__grid">
        {backlinks.map((item) => (
          <a
            key={item.id}
            href={item.url}
            className="newsroom-backlink-card-link"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  {item.title}{' '}
                  <span aria-hidden="true" className="newsroom-backlink-arrow">
                    ↗
                  </span>
                </CardTitle>
                {item.description ? (
                  <CardDescription>{item.description}</CardDescription>
                ) : null}
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
