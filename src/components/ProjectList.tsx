import { Separator } from '@/components/ui/separator';
import type { ProjectSummary } from '../data/projects';

interface Props {
  projects: ProjectSummary[];
}

export default function ProjectList({ projects }: Props) {
  return (
    <ul className="content-list" aria-label="프로젝트 목록">
      {projects.map((project, index) => (
        <li key={project.id}>
          <article className="content-row project-row">
            {project.icon ? (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-icon-link"
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  src={project.icon}
                  alt=""
                  className="project-icon"
                  width={80}
                  height={80}
                  loading="lazy"
                />
              </a>
            ) : null}
            <div className="project-row-body">
              <h2>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="content-link"
                >
                  {project.title}
                  <span aria-hidden="true" className="project-external-arrow">
                    ↗
                  </span>
                </a>
              </h2>
              <p className="content-description text-muted-foreground">
                {project.description ?? '프로젝트 소개를 준비하고 있습니다.'}
              </p>
            </div>
          </article>
          {index < projects.length - 1 && <Separator className="my-2" />}
        </li>
      ))}
    </ul>
  );
}
