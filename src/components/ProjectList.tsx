import { Link, Separator, Typography } from '@heroui/react';
import type { ProjectSummary } from '../data/projects';

interface Props {
  projects: ProjectSummary[];
}

export default function ProjectList({ projects }: Props) {
  return (
    <ul className="content-list" aria-label="프로젝트 목록">
      {projects.map((project, index) => (
        <li key={project.id}>
          <article className="content-row">
            <Typography.Heading level={2}>
              <Link href={project.href} className="content-link">
                {project.title}
              </Link>
            </Typography.Heading>
            <Typography.Paragraph color="muted" className="content-description">
              {project.description ?? '프로젝트 소개를 준비하고 있습니다.'}
            </Typography.Paragraph>
          </article>
          {index < projects.length - 1 && (
            <Separator className="content-divider" />
          )}
        </li>
      ))}
    </ul>
  );
}
