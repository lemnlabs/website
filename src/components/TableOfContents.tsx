import { useEffect, useRef, useState } from 'react';

export interface MarkdownHeading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: MarkdownHeading[];
}

export function TableOfContentsMobile({ headings }: Props) {
  if (headings.length === 0) return null;

  const minDepth = Math.min(...headings.map((h) => h.depth));

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', `#${slug}`);
    }
  };

  return (
    <nav className="blog-toc-mobile" aria-label="본문 목차">
      <ul className="blog-toc-mobile__list">
        {headings.map((heading) => {
          const relativeDepth = heading.depth - minDepth;
          return (
            <li
              key={heading.slug}
              className="blog-toc-mobile__item"
              data-depth={relativeDepth}
            >
              <a
                href={`#${heading.slug}`}
                className="blog-toc-mobile__link"
                onClick={(e) => handleLinkClick(e, heading.slug)}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.slug ?? '');
  const isClickScrollingRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const minDepth =
    headings.length > 0 ? Math.min(...headings.map((h) => h.depth)) : 0;

  useEffect(() => {
    if (headings.length === 0) return;

    let ticking = false;

    const updateActiveHeading = () => {
      if (isClickScrollingRef.current) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      // Bottom of the page: activate the last heading
      if (scrollTop + clientHeight >= scrollHeight - 60) {
        setActiveId(headings[headings.length - 1].slug);
        return;
      }

      // Find heading closest to top threshold (130px accommodates floating nav)
      const threshold = 130;
      let currentId = headings[0]?.slug ?? '';

      for (const heading of headings) {
        const element = document.getElementById(heading.slug);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top <= threshold) {
          currentId = heading.slug;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveHeading();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, [headings]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (!element) return;

    isClickScrollingRef.current = true;
    setActiveId(slug);
    element.scrollIntoView({ behavior: 'smooth' });
    history.pushState(null, '', `#${slug}`);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 800);
  };

  if (headings.length === 0) return null;

  return (
    <div className="notion-toc" aria-label="본문 목차">
      {/* Notion-style Vertical Indicator Bars */}
      <nav className="notion-toc__bars" aria-label="빠른 목차 이동">
        {headings.map((heading) => {
          const relativeDepth = heading.depth - minDepth;
          const isActive = activeId === heading.slug;

          return (
            <a
              key={heading.slug}
              href={`#${heading.slug}`}
              className="notion-toc__bar-item"
              data-depth={relativeDepth}
              data-active={isActive ? 'true' : 'false'}
              aria-label={heading.text}
              title={heading.text}
              onClick={(e) => handleLinkClick(e, heading.slug)}
            >
              <span className="notion-toc__bar-line" />
            </a>
          );
        })}
      </nav>

      {/* Popover Flyout on Hover (covers the indicator bars) */}
      <div className="notion-toc__popover" role="dialog" aria-label="목차 상세">
        <ul className="notion-toc__popover-list">
          {headings.map((heading) => {
            const relativeDepth = heading.depth - minDepth;
            const isActive = activeId === heading.slug;

            return (
              <li
                key={heading.slug}
                className="notion-toc__popover-item"
                data-depth={relativeDepth}
              >
                <a
                  href={`#${heading.slug}`}
                  className="notion-toc__popover-link"
                  data-active={isActive ? 'true' : 'false'}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={(e) => handleLinkClick(e, heading.slug)}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
