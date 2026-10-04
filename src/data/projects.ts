import { getCollection, type CollectionEntry } from 'astro:content';

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  href: string;
}

export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
  );
}

export function getProjectUrl(project: CollectionEntry<'projects'>) {
  return `${import.meta.env.BASE_URL}projects/${encodeURIComponent(project.id)}/`;
}
