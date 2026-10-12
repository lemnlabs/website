import { useEffect, useState } from 'react';
import { Button, Separator, Typography } from '@heroui/react';
import {
  NEWS_CATEGORIES,
  isValidCategory,
  type NewsArticleSummary,
  type NewsCategory,
} from '../data/newsroom-categories';
import NewsroomRow from './NewsroomRow';
import EmptyState from './EmptyState';

interface Props {
  articles: NewsArticleSummary[];
  base: string;
}

function readSelectedCategory(): NewsCategory | null {
  const param = new URLSearchParams(window.location.search).get('category');
  return isValidCategory(param) ? param : null;
}

export default function NewsroomList({ articles, base }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | null>(
    null,
  );

  useEffect(() => {
    const restoreSelection = () => setSelectedCategory(readSelectedCategory());
    restoreSelection();
    window.addEventListener('popstate', restoreSelection);
    return () => window.removeEventListener('popstate', restoreSelection);
  }, []);

  function selectCategory(category: NewsCategory | null) {
    if (category === selectedCategory) return;
    const url = new URL(window.location.href);
    if (category) url.searchParams.set('category', category);
    else url.searchParams.delete('category');
    window.history.pushState(null, '', url);
    setSelectedCategory(category);
  }

  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles;

  const filterOptions: (NewsCategory | null)[] = [null, ...NEWS_CATEGORIES];

  return (
    <>
      <div
        className="newsroom-category-filters"
        role="group"
        aria-label="카테고리로 뉴스 찾기"
      >
        {filterOptions.map((category) => (
          <Button
            key={category ?? 'all'}
            variant={selectedCategory === category ? 'primary' : 'secondary'}
            size="sm"
            className="newsroom-category-filter"
            aria-pressed={selectedCategory === category}
            aria-controls="newsroom-article-results"
            onPress={() => selectCategory(category)}
          >
            {category ?? '전체'}
          </Button>
        ))}
      </div>
      <Typography.Paragraph
        size="sm"
        color="muted"
        className="newsroom-result-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedCategory
          ? `‘${selectedCategory}’ · ${filteredArticles.length}개의 소식`
          : `전체 ${filteredArticles.length}개의 소식`}
      </Typography.Paragraph>
      <div id="newsroom-article-results">
        {filteredArticles.length > 0 ? (
          <ul className="content-list" aria-label="뉴스룸 소식 목록">
            {filteredArticles.map((article, index) => (
              <li key={article.id}>
                <NewsroomRow {...article} base={base} />
                {index < filteredArticles.length - 1 && (
                  <Separator className="content-divider" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            message={
              selectedCategory
                ? `‘${selectedCategory}’ 소식이 없습니다.`
                : '아직 등록된 소식이 없습니다.'
            }
          />
        )}
      </div>
    </>
  );
}
