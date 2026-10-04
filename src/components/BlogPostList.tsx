import { useEffect, useMemo, useState } from 'react';
import { Button, Separator, Typography } from '@heroui/react';
import { normalizeTag, type BlogPostSummary } from '../data/blog-tags';
import BlogPostRow from './BlogPostRow';
import EmptyState from './EmptyState';

interface Props {
  posts: BlogPostSummary[];
  base: string;
}

function readSelectedTag() {
  return (
    normalizeTag(
      new URLSearchParams(window.location.search).get('tag') ?? '',
    ) || null
  );
}

export default function BlogPostList({ posts, base }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const tags = useMemo(
    () =>
      [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
        a.localeCompare(b, 'ko'),
      ),
    [posts],
  );

  useEffect(() => {
    const restoreSelection = () => setSelectedTag(readSelectedTag());
    restoreSelection();
    window.addEventListener('popstate', restoreSelection);
    return () => window.removeEventListener('popstate', restoreSelection);
  }, []);

  function selectTag(tag: string | null) {
    if (tag === selectedTag) return;
    const url = new URL(window.location.href);
    if (tag) url.searchParams.set('tag', tag);
    else url.searchParams.delete('tag');
    window.history.pushState(null, '', url);
    setSelectedTag(tag);
  }

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags.includes(selectedTag))
    : posts;

  return (
    <>
      <div
        className="blog-tag-filters"
        role="group"
        aria-label="태그로 글 찾기"
      >
        {[null, ...tags].map((tag) => (
          <Button
            key={tag === null ? 'all' : `tag:${tag}`}
            variant={selectedTag === tag ? 'primary' : 'secondary'}
            size="sm"
            className="blog-tag-filter"
            aria-pressed={selectedTag === tag}
            aria-controls="blog-post-results"
            onPress={() => selectTag(tag)}
          >
            {tag ?? '전체'}
          </Button>
        ))}
      </div>
      <Typography.Paragraph
        size="sm"
        color="muted"
        className="blog-result-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedTag
          ? `‘${selectedTag}’ 태그 · ${filteredPosts.length}개의 글`
          : `전체 ${filteredPosts.length}개의 글`}
      </Typography.Paragraph>
      <div id="blog-post-results">
        {filteredPosts.length > 0 ? (
          <ul className="content-list" aria-label="블로그 글 목록">
            {filteredPosts.map((post, index) => (
              <li key={post.id}>
                <BlogPostRow {...post} base={base} />
                {index < filteredPosts.length - 1 && (
                  <Separator className="content-divider" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            message={
              selectedTag
                ? `‘${selectedTag}’ 태그의 글이 없습니다.`
                : '아직 등록된 글이 없습니다.'
            }
          />
        )}
      </div>
    </>
  );
}
