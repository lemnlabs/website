# lemnlabs Website

Astro와 TypeScript로 구성한 GitHub Pages용 정적 웹사이트입니다.

## 로컬 개발

mise로 Node.js 24.21.0과 pnpm 12.8.1을 관리합니다. 버전은 `mise.toml`에 고정되어 있습니다.
[mise 설치](https://mise.jdx.dev/installing-mise.html) 후 저장소 루트에서 실행하세요.

```sh
mise trust
mise install
mise run install
mise run dev
```

`mise run install`은 `pnpm install --frozen-lockfile`을 실행합니다.
`mise run check`, `mise run build`, `mise run preview`도 사용할 수 있습니다.
셸에 mise를 활성화한 경우 아래 pnpm 명령을 직접 실행할 수 있고, 그렇지 않으면 `mise exec -- pnpm build`처럼 실행합니다.

개발 서버: <http://localhost:4321/>

| 명령                | 설명                               |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | 개발 서버 실행                     |
| `pnpm check`        | Astro 및 TypeScript 검사           |
| `pnpm format`       | 전체 파일 자동 포매팅              |
| `pnpm format:check` | 전체 파일 포매팅 검사              |
| `pnpm lint`         | 전체 코드 린트 (경고도 실패 처리)  |
| `pnpm lint:fix`     | 자동 수정 가능한 린트 오류 수정    |
| `pnpm build`        | 검사 후 `dist/`에 정적 사이트 생성 |
| `pnpm preview`      | 빌드 결과 로컬 미리보기            |

의존성 추가·변경에는 `pnpm add` 또는 `pnpm install`을 사용하고 생성된 `pnpm-lock.yaml`을 커밋하세요.
`mise.toml`의 pnpm 버전을 변경하면 `package.json`의 `packageManager`도 함께 변경합니다.
`pnpm-workspace.yaml`은 빌드에 필요한 esbuild 설치 스크립트를 허용하고 선택적 fsevents 스크립트는 실행하지 않습니다.

## 프로젝트 구조

```text
src/
  layouts/Layout.astro    # HTML, 메타데이터, 공통 스타일
  pages/                 # 홈, 프로젝트, 뉴스룸, 소개 페이지
  components/            # 공통 UI 컴포넌트 및 shadcn/ui 기반 컴포넌트
  content/newsroom/      # 마크다운 뉴스룸 소식
  content/projects/      # 프로젝트 메타데이터와 본문
  content/pages/about.md # 소개 메타데이터와 본문
  templates/newsroom.md  # 수집 대상 밖의 뉴스룸 작성 템플릿
  content.config.ts      # 콘텐츠 메타데이터 스키마 및 로더
  data/newsroom.ts       # 소식 조회, 최신순 정렬, 소식 주소
  data/projects.ts       # 프로젝트 조회, 정렬, 주소
  lib/utils.ts           # cn 헬퍼 함수
  styles/global.css      # Tailwind v4 및 테마 토큰 스타일
.agents/                 # AI 어시스턴트용 워크스페이스 스킬 (shadcn/ui 공식 스킬 등)
skills-lock.json         # 설치된 AI 스킬 버전 및 해시 잠금 파일
public/                  # 정적 파일
astro.config.mjs         # 사이트 URL 및 배포 경로
mise.toml                # Node.js/pnpm 버전 및 개발 작업
pnpm-workspace.yaml      # 의존성 설치 스크립트 설정
pnpm-lock.yaml           # 고정된 의존성 버전
.github/workflows/deploy.yml
```

`public/` 파일이나 내부 페이지를 연결할 때는 `import.meta.env.BASE_URL`을 사용하세요.
예:

```astro
<a href={`${import.meta.env.BASE_URL}about/`}>소개</a>
```

## GitHub Pages 배포

1. 저장소 [Settings → Pages](https://github.com/lemnlabs/website/settings/pages)에서 **Build and deployment → Source → GitHub Actions**를 선택합니다.
2. 변경사항을 커밋하고 `main` 브랜치에 push합니다.
3. Actions의 `Deploy to GitHub Pages` 워크플로가 성공하면 <https://lemnlabs.com/>에 배포됩니다.

CI에서도 mise로 동일한 Node.js/pnpm 버전을 설치하고 `pnpm install --frozen-lockfile` 및 `pnpm build`를 실행합니다.
CI에서는 `HUSKY=0`으로 로컬 훅 설치를 생략하고 전체 포매팅 검사, 린트, 타입 체크 및 빌드를 순서대로 실행합니다.
PR에서는 검사 및 빌드만 실행합니다. `main` push와 수동 실행에서는 배포까지 수행합니다.
`pnpm-lock.yaml`도 함께 커밋해 CI에서 동일한 의존성을 설치하도록 합니다.

현재 `site`는 `https://lemnlabs.com`, `base`는 `/`이고 `public/CNAME`에는 `lemnlabs.com`이 설정되어 있습니다.
GitHub Pages의 Custom domain을 `lemnlabs.com`으로 설정하고 도메인 공급자의 DNS도 구성해야 합니다.
DNS 및 Pages 설정이 완료되어야 실제 도메인으로 접속할 수 있습니다.

## 페이지 구성

| 경로                | 내용                             |
| ------------------- | -------------------------------- |
| `/`                 | 별 애니메이션 로고와 주요 메뉴   |
| `/projects/`        | 프로젝트 목록 (외부 사이트 이동) |
| `/newsroom/`        | 전체 소식 목록 (최신순)          |
| `/newsroom/{slug}/` | 마크다운 소식 상세 페이지        |
| `/about/`           | lemnlabs 소개                    |

홈은 제공된 별 애니메이션 화면을 사용합니다. 플로팅 캡슐 메뉴에서 홈·프로젝트·뉴스룸·소개로 이동할 수 있습니다.
메뉴는 화면 상단 중앙에 고정되며 `src/components/FloatingNavigation.tsx`에서 관리합니다.
`src/components/Starfield.astro`에서 화면을, `src/scripts/starfield/`의 TypeScript 모듈에서 애니메이션을 관리합니다. Astro가 스크립트를 번들링하며 별 생성·공통 타입·WGSL 셰이더·렌더링 엔진·수명주기를 분리합니다.
WebGPU를 우선 사용하고 초기화 실패나 장치 연결 종료 시 Canvas 2D로 전환합니다. 두 엔진 모두 사용할 수 없으면 텍스트 로고를 유지합니다. 동작 줄이기 설정에서는 별을 원래 위치에 정적으로 표시합니다. 입력은 캔버스에 한정하며 페이지 이탈 시 이벤트와 GPU 자원을 정리하고 브라우저 뒤로 가기로 복귀하면 재초기화합니다.

프로젝트는 `src/content/projects/`의 마크다운 파일에서 관리하며, 상세 페이지 없이 각 프로젝트의 공식 웹사이트로 직접 연결됩니다. 목록 항목 좌측에는 앱 아이콘이 표시됩니다.

## 프로젝트·소개 작성

프로젝트는 `src/content/projects/leaf.md`처럼 폴더 바로 아래에 마크다운 파일을 추가하세요.

```markdown
---
title: '프로젝트 이름'
description: '선택 항목: 목록에 표시할 요약'
url: 'https://leaf.lemnlabs.com/'
icon: '/images/projects/leaf-icon.png'
order: 1
---
```

- `title`과 `url`은 필수입니다. 목록에서 프로젝트 클릭 시 해당 웹사이트로 새 탭에서 열립니다.
- `description`은 생략할 수 있으며, 생략하면 목록에 준비 안내를 표시합니다.
- `icon`은 선택 항목으로, 공개 이미지 경로를 지정하면 목록 좌측에 앱 아이콘이 표시됩니다.
- `order`는 정수이며 생략하면 0입니다. 작은 값부터 정렬하고, 같으면 파일 ID 순으로 정렬합니다.
- 소개는 `src/content/pages/about.md`의 필수 `title`, `description`과 본문을 수정하세요. 이 폴더에 다른 파일을 추가해도 페이지 경로는 자동 생성되지 않습니다.
- 소개는 본문이 비어 있거나 공백뿐이면 기존 준비 안내 문구를 표시합니다. 본문을 작성하면 공용 마크다운 스타일로 표시합니다.
- 프로젝트와 뉴스룸 콘텐츠 폴더에 파일을 추가하면 빌드·배포 시 공개됩니다. 초안 기능은 없습니다. 작성 중인 파일과 템플릿은 콘텐츠 폴더 밖에서 관리하세요.
- 로컬 이미지와 내부 링크 작성 규칙은 아래 뉴스룸 안내와 같습니다.

## 마크다운 뉴스룸 소식 추가

`src/templates/newsroom.md`를 복사해 실제 내용을 작성한 뒤 `src/content/newsroom/`에 저장하세요. 템플릿 원본은 콘텐츠로 수집하지 않습니다.

- **이미지가 없는 소식**: `src/content/newsroom/release-v1.md`처럼 단일 파일로 저장할 수 있습니다.
- **이미지가 포함된 소식(Page Bundle 권장)**: `src/content/newsroom/release-v1/index.md`처럼 폴더를 만들고 이미지와 함께 저장합니다.
  두 방식 모두 주소는 동일하게 `/newsroom/release-v1/`가 됩니다.

파일 상단의 YAML 메타데이터와 아래 마크다운 본문을 작성합니다.

```markdown
---
title: '소식 제목'
description: '소식 목록과 검색 결과에 표시할 요약'
category: '보도자료'
publishedAt: '2026-10-13'
---

## 소제목

본문을 마크다운으로 작성합니다.
```

- `title`, `description`, `category`, `publishedAt`은 필수입니다. 잘못된 메타데이터는 빌드 시 오류로 표시됩니다.
- `category`는 고정 카테고리로 `'공지사항'`, `'보도자료'`, `'미디어'` 중 하나를 지정합니다. 지정된 카테고리 이외의 값은 빌드 오류로 표시됩니다.
- `publishedAt`은 유효한 `YYYY-MM-DD` 날짜이며 목록은 이 날짜의 최신순으로 정렬합니다. 날짜는 예약 발행 기능이 아닙니다.
- `src/content/newsroom/`의 모든 마크다운 소식은 목록과 상세 페이지에 포함됩니다. 파일을 추가하면 빌드·배포 시 공개되며, 초안 기능은 없습니다.
- 제목, 목록, 인용문, 코드 블록, 표, 이미지를 지원합니다. Page Bundle 구조에서는 `index.md`와 같은 폴더에 이미지를 두고 `![대체 텍스트](./image.png)`처럼 상대 경로로 연결하면 Astro와 Sharp가 빌드 타임에 WebP로 자동 최적화하여 반응형 `<img>` 태그를 생성합니다.
- 내부 페이지와 `public/` 파일 경로를 본문에 직접 작성할 때는 배포 base 경로를 포함하세요. 현재 base는 `/`입니다. 파일 이름을 변경하면 소식 주소도 바뀝니다.

`mise run build` 후 `mise run preview`로 목록과 소식 상세를 확인하세요. 배포 절차는 위 GitHub Pages 설정과 동일합니다.
뉴스룸은 전체 소식 목록과 개별 소식 상세 페이지로 구성됩니다. 상단에서 카테고리(전체, 공지사항, 보도자료, 미디어)를 선택하면 목록이 즉시 필터링되며 `전체`로 해제합니다.
소식 목록과 상세 페이지의 카테고리 배지 링크도 필터된 목록으로 이동합니다. 선택은 `/newsroom/?category=보도자료`처럼 주소에 저장되어 새로고침, 공유, 뒤로·앞으로 가기에서도 유지됩니다. 해당 카테고리에 글이 없으면 빈 결과 안내를 표시합니다. 소식 주소는 그대로 유지하며 카테고리별 하위 페이지는 생성하지 않습니다.
필터와 목록은 React로 활성화하고 shadcn/ui의 `Button`, `Separator`와 표준 링크를 사용합니다. 카테고리 필터는 `Button`의 `aria-pressed`로 선택 상태를 전달하며, 소식의 카테고리는 `buttonVariants({ variant: 'secondary', size: 'sm' })`를 적용해 배지 모양의 링크로 표시합니다. 서버에서는 전체 소식 목록을 렌더링하며 브라우저에서 JavaScript 활성화 후 주소의 필터를 적용합니다. 본문은 Astro가 정적 HTML로 렌더링합니다.
뉴스룸 목록은 카드 없이 소식 사이에 구분선을 표시하며, 카테고리·날짜 메타와 제목, 요약을 왼쪽 기준선에 정렬합니다. 행의 호버 배경은 사용하지 않습니다. 상세 화면의 돌아가기 링크는 제목 왼쪽 위에서 tertiary 버튼 스타일을 사용합니다.

## 마크다운 콜아웃

뉴스룸·프로젝트·소개 본문에서 다음 문법을 사용할 수 있습니다.

```markdown
> [!info]
> 참고할 내용을 작성합니다.

> [!warning] 사용자 지정 제목
> **강조**, 링크, 목록 등 마크다운을 사용할 수 있습니다.
>
> - 첫 번째 항목
> - 두 번째 항목
```

콜아웃은 배경과 둥근 테두리 없이 왼쪽 색상선·유형별 아이콘·색상 제목으로 표시합니다. 정보·참고는 파랑, 팁은 초록, 중요는 보라, 주의는 주황, 경고는 빨강이며 라이트·다크 테마에 따라 가독성을 조정합니다. 아이콘은 장식용 CSS로 표시하고 유형은 텍스트 제목으로 전달합니다.

지원 유형은 `info`(정보), `note`(참고), `tip`(팁), `important`(중요), `warning`(주의), `caution`(경고)이며 대소문자를 구분하지 않습니다. 제목을 생략하면 괄호 안의 기본 제목을 표시합니다. 일반 인용문과 지원하지 않는 표식은 기존 인용문으로 표시합니다. 접기·펼치기 문법(`[!info]+`, `[!info]-`)은 지원하지 않습니다.

[Astro의 Markdown processor 설정](https://docs.astro.build/en/guides/markdown-content/#setting-up-a-markdown-processor)에 따라 `@astrojs/markdown-remark`의 `unified()`와 `src/plugins/remark-callouts.mjs`를 사용해 빌드 시 정적 HTML로 변환합니다. 공통 스타일은 `src/styles/global.css`에서 관리합니다.

## 디자인 시스템

[shadcn/ui](https://ui.shadcn.com) 기반의 컴포넌트와 Tailwind CSS v4를 사용합니다.
`src/components/ui/`에 `Button`, `Card`, `Separator`, `Badge` 등의 베이스 컴포넌트가 위치하며, `@shadcn/lint`로 디자인 시스템 규칙을 강제합니다.
스타일은 `src/styles/global.css`에서 Tailwind v4 `@theme inline` 및 OKLCH 테마 토큰으로 관리합니다.

### @shadcn/lint 디자인 시스템 검증

ESLint Flat Config(`eslint.config.mjs`)에 `@shadcn/lint` 플러그인이 통합되어 있습니다.

- `shadcn/no-restyle`: 컴포넌트 내부 캡슐화를 위반하는 임의 클래스 추가를 방지합니다. 레이아웃 클래스(`mt-*`, `w-full` 등)나 부모 요소를 통한 스타일링을 권장합니다.
- `shadcn/no-arbitrary-values`: `p-[13px]`와 같은 임의 값을 차단하고 테마 스케일 사용을 강제합니다.
- `shadcn/no-raw-colors`: 원시 색상 대신 선언된 시맨틱 테마 토큰(`--background`, `--foreground`, `--primary`, `--muted` 등)을 사용하도록 유도합니다.
- 베이스 컴포넌트(`src/components/ui/**`)는 자체 스타일을 선언하므로 규칙에서 제외됩니다.

시스템 설정에 따라 라이트·다크 테마가 자동 전환되며, 페이지를 열어 둔 상태에서 설정을 바꿔도 즉시 반영됩니다. JavaScript가 비활성화되면 라이트 테마를 사용합니다. 홈의 검은 별 배경은 유지하고 메뉴는 시스템 테마를 따릅니다.
브랜드 노란색 `#F7DA4A`를 강조 색상(`--accent`, `--brand`)으로 지정합니다. Radius는 `--radius: 0.5rem` 기준 스케일을 따릅니다.
플로팅 메뉴는 캡슐 모양 네비게이션 내에서 `buttonVariants({ variant: 'ghost' })`를 적용하며 `@astrojs/react`를 통해 React 19로 렌더링하고 `client:load`로 활성화합니다.
Tab 키로 메뉴 포커스를 이동하고 Enter로 페이지를 열 수 있습니다. 현재 섹션은 진하게, 나머지는 연하게 표시하며 선택 배경은 사용하지 않습니다.

페이지 UI는 React로 작성하고 Astro는 라우팅, 빌드 시 데이터 조회, 문서 메타데이터, Markdown 렌더링과 island 조합을 담당합니다. `PageTitle`, `DetailFrame`, `NewsroomArticleHeader`, `MarkdownBody`는 `client:*` 없이 정적 HTML로 렌더링합니다. 기존 링크와 필터는 Astro에서 직접 `client:load`를 지정해 활성화하고, 상세 구조 안에는 슬롯으로 전달합니다.

프로젝트 목록과 소개는 뉴스룸과 일관된 제목 크기와 왼쪽 정렬을 사용합니다. 프로젝트 목록은 Separator를 사용하는 세로 행이며, 상세 화면의 돌아가기 링크는 제목 왼쪽 위에서 `DetailBackLink.tsx`(`buttonVariants({ variant: 'tertiary' })`)를 사용합니다. 프로젝트 상세와 소개는 본문이 비어 있으면 준비 안내 문구를 표시하고, 작성된 본문은 공용 MarkdownBody로 렌더링합니다.

## 커밋 전 검사

의존성 설치 시 `prepare` 스크립트가 Husky 훅을 활성화합니다. `git commit` 전에 mise의 고정된 Node.js/pnpm으로 다음 검사를 순서대로 실행합니다.

1. lint-staged가 스테이징된 JS/TS/TSX/Astro 코드에 ESLint 자동 수정을 적용합니다.
2. Prettier가 스테이징된 코드와 CSS, JSON, Markdown, YAML, HTML/SVG를 포매팅하고 lint-staged가 결과를 다시 스테이징합니다.
3. `pnpm check`가 작업 디렉터리 전체의 Astro 및 TypeScript 타입을 검사합니다.

오류나 린트 경고가 남으면 커밋이 차단됩니다. 부분 스테이징한 파일의 미스테이징 변경은 lint-staged 기본 보호 기능으로 보존합니다. 타입 체크는 미스테이징 코드도 포함하므로 해당 코드의 타입 오류 역시 커밋을 차단합니다. 타입 검사 실패 시 이미 적용된 포매팅은 유지되며 수정 후 다시 커밋하세요.

훅 실행에는 Git 프로세스의 PATH에서 `mise`를 사용할 수 있어야 합니다. GUI Git 클라이언트도 동일하게 설정하세요. 셸에 mise를 활성화하지 않아도 훅이 `mise exec --`로 도구를 실행합니다.
`mise run format`, `mise run format:check`, `mise run lint`, `mise run lint:fix`로도 명령을 실행할 수 있습니다.
생성 디렉터리(`node_modules`, `dist`, `.astro`, Husky 내부 파일), `.agents/` 및 pnpm 잠금 파일은 포매팅 대상에서 제외합니다. 린트는 JS/TS/TSX/Astro 코드에 적용하며 타입 기반 린트 대신 기존 Astro 타입 체크를 사용합니다.
