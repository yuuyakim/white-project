# かき氷屋HP 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 友人が営むかき氷屋の店舗紹介サイト（静的4ページ + お知らせ）をAstroで構築する。

**Architecture:** Astroの静的サイト生成。メニューとお知らせはMarkdownファイルとしてContent Collectionsで管理し、zodスキーマがビルド時に不正なデータを検出する。店舗情報は `src/data/shop.ts` の1ファイルを唯一の情報源とし、全ページがそこを参照する。UIコンポーネントはpropsを受け取って表示するだけに徹し、データ取得はページ側で行う。

**Tech Stack:** Astro 6、TypeScript（strict）、素のCSS（フレームワークなし）、Astro Image（`astro:assets`）

## Global Constraints

- 設計書は `docs/superpowers/specs/2026-07-28-kakigori-site-design.md`。仕様の正はこちら
- 作業ディレクトリは `C:\Users\yuuya\test_prj\kakigori-site`（Git初期化済み、`main` ブランチ、spec commit済み）
- **自動テストは書かない。** 設計書のスコープ外に明記されている。検証は毎タスク `npm run build` の成功（zodスキーマ違反はここで落ちる）と `npx astro check` の型チェック通過をもって行う
- 店舗の実データ（住所・電話番号・営業時間・SNSアカウント）は未確定。`src/data/shop.ts` にプレースホルダの日本語文字列を入れ、`// TODO: 実データに差し替え` コメントを付ける。**これはコードのTODOであり、計画上の未定事項ではない**
- 画像素材は未入手。`src/assets/images/` にプレースホルダのSVGを置いて進める
- CSSはコンポーネント内の `<style>` に閉じ込める。`global.css` にはリセット・CSS変数・タイポグラフィのみ置く
- 日本語サイトのため `<html lang="ja">` 固定
- コミットは各タスク末尾で行う。コミットメッセージは日本語、Conventional Commitsのprefix付き

---

## File Structure

| ファイル | 責務 |
|---|---|
| `astro.config.mjs` | サイトURL、ビルド設定 |
| `src/data/shop.ts` | 店舗情報の唯一の情報源。型と定数のみ、ロジックなし |
| `src/content.config.ts` | menu / news コレクションのloaderとzodスキーマ |
| `src/layouts/BaseLayout.astro` | head、meta、OGP、JSON-LD、Header/Footerを含む全ページ共通の外枠 |
| `src/layouts/NewsLayout.astro` | お知らせ詳細の本文枠。BaseLayoutを内包 |
| `src/components/Header.astro` | グローバルナビ |
| `src/components/Footer.astro` | 店舗情報要約とコピーライト |
| `src/components/SnsLinks.astro` | SNSリンク一覧 |
| `src/components/BusinessHours.astro` | 営業時間・定休日の整形表示 |
| `src/components/Hero.astro` | トップのファーストビュー |
| `src/components/MenuCard.astro` | メニュー1件の表示 |
| `src/components/NewsList.astro` | お知らせ配列の一覧表示。件数上限をpropsで受ける |
| `src/pages/*.astro` | ルーティングとデータ取得 |

---

### Task 1: プロジェクト初期化

Astroの対話式スキャフォールド（`npm create astro@latest`）は使わない。既存の `docs/` と `.git/` があるディレクトリでは非空ディレクトリの確認プロンプトが出て自動実行が止まるため、手動でセットアップする。

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/styles/global.css`
- Create: `src/pages/index.astro`（この時点では動作確認用の最小内容）

- [ ] **Step 1: `package.json` を作成**

```json
{
  "name": "kakigori-site",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

- [ ] **Step 2: 依存をインストール**

Run: `npm install astro`
Run: `npm install -D @astrojs/check typescript`

`@astrojs/check` は `astro check`（`.astro` ファイルの型チェック）に必要。

- [ ] **Step 3: `astro.config.mjs` を作成**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO: 独自ドメイン取得後に実URLへ差し替え。sitemap/OGPの絶対URL生成に使う
  site: 'https://example.com',
});
```

- [ ] **Step 4: `tsconfig.json` を作成**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: `.gitignore` を作成**

```
node_modules/
dist/
.astro/
.DS_Store
npm-debug.log*
```

- [ ] **Step 6: `src/styles/global.css` を作成**

CSS変数とリセットのみ。レイアウトはここに書かない。

```css
:root {
  --color-bg: #fdfcfa;
  --color-text: #2b2b2b;
  --color-text-muted: #6b6b6b;
  --color-accent: #4aa3c7;
  --color-accent-dark: #2f7d9c;
  --color-border: #e5e1db;
  --font-base: "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif;
  --max-width: 960px;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
p,
figure,
ul {
  margin: 0;
}

ul {
  padding: 0;
  list-style: none;
}

html {
  color-scheme: light;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-base);
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: var(--color-accent-dark);
}
```

- [ ] **Step 7: 動作確認用の `src/pages/index.astro` を作成**

Task 7で本実装に差し替える。

```astro
---
import '../styles/global.css';
---

<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>セットアップ確認</title>
  </head>
  <body>
    <p>セットアップ確認</p>
  </body>
</html>
```

- [ ] **Step 8: ビルドが通ることを確認**

Run: `npm run build`
Expected: `Complete!` で終了し `dist/index.html` が生成される

- [ ] **Step 9: 型チェックが通ることを確認**

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 10: コミット**

```bash
git add -A
git commit -m "chore: Astroプロジェクトを初期化"
```

---

### Task 2: 店舗情報の単一情報源

**Files:**
- Create: `src/data/shop.ts`

**Interfaces:**
- Produces: `shop` オブジェクト（default exportではなくnamed export）。以降の全タスクが `import { shop } from '../data/shop'` で参照する。プロパティ: `name`, `nameEn`, `description`, `address`, `tel`, `email`, `businessHours: BusinessHour[]`, `closedNote`, `parking`, `payments: string[]`, `mapUrl`, `mapEmbedUrl`, `sns: { instagram?, x?, line? }`
- Produces: `type BusinessHour = { days: string; open: string; close: string; note?: string }`

- [ ] **Step 1: `src/data/shop.ts` を作成**

実データは未確定のためプレースホルダを入れる。`as const` を付けて型を絞る。

```ts
export type BusinessHour = {
  /** 曜日の表記。例: "平日", "土日祝" */
  days: string;
  /** 開店時刻。例: "11:00" */
  open: string;
  /** 閉店時刻。例: "18:00" */
  close: string;
  /** 補足。例: "氷がなくなり次第終了" */
  note?: string;
};

export type Sns = {
  instagram?: string;
  x?: string;
  line?: string;
};

// TODO: 実データに差し替え（店主に確認する）
export const shop = {
  name: 'かき氷店（仮）',
  nameEn: 'Kakigori Shop',
  description: '天然氷とその日の果物でつくるかき氷のお店です。',
  address: '東京都◯◯区◯◯1-2-3',
  tel: '03-0000-0000',
  email: 'info@example.com',
  businessHours: [
    { days: '平日', open: '11:00', close: '18:00' },
    { days: '土日祝', open: '10:00', close: '19:00', note: '氷がなくなり次第終了' },
  ] satisfies BusinessHour[],
  closedNote: '定休日: 火曜日',
  parking: '専用駐車場なし。近隣のコインパーキングをご利用ください。',
  payments: ['現金', 'PayPay', 'クレジットカード'],
  /** Googleマップの共有リンク（別タブで開く用） */
  mapUrl: 'https://maps.google.com/?q=' + encodeURIComponent('東京都◯◯区◯◯1-2-3'),
  /** Googleマップの埋め込みiframe用URL */
  mapEmbedUrl: 'https://maps.google.com/maps?q=' + encodeURIComponent('東京都◯◯区◯◯1-2-3') + '&output=embed',
  sns: {
    instagram: 'https://www.instagram.com/example/',
  } satisfies Sns,
};
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 3: コミット**

```bash
git add src/data/shop.ts
git commit -m "feat: 店舗情報の単一情報源を追加"
```

---

### Task 3: 共通レイアウトとヘッダー・フッター

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/SnsLinks.astro`
- Create: `src/components/BusinessHours.astro`
- Create: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `shop` from `src/data/shop.ts`
- Produces: `BaseLayout` — props `{ title: string; description?: string; ogImage?: string }`。`title` はサイト名を自動で後置するため、ページ側は「メニュー」のようにページ名だけ渡す
- Produces: `BusinessHours` — props なし。`shop.businessHours` を直接読む
- Produces: `SnsLinks` — props なし

- [ ] **Step 1: `src/components/SnsLinks.astro` を作成**

```astro
---
import { shop } from '../data/shop';

const links = [
  { key: 'instagram', label: 'Instagram', url: shop.sns.instagram },
  { key: 'x', label: 'X', url: shop.sns.x },
  { key: 'line', label: 'LINE', url: shop.sns.line },
].filter((link) => Boolean(link.url));
---

<ul class="sns">
  {
    links.map((link) => (
      <li>
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      </li>
    ))
  }
</ul>

<style>
  .sns {
    display: flex;
    gap: var(--space-md);
  }

  .sns a {
    text-decoration: none;
    font-size: 0.9rem;
  }

  .sns a:hover {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 2: `src/components/BusinessHours.astro` を作成**

```astro
---
import { shop } from '../data/shop';
---

<div class="hours">
  <dl>
    {
      shop.businessHours.map((hour) => (
        <>
          <dt>{hour.days}</dt>
          <dd>
            {hour.open}〜{hour.close}
            {hour.note && <span class="note">（{hour.note}）</span>}
          </dd>
        </>
      ))
    }
  </dl>
  <p class="closed">{shop.closedNote}</p>
</div>

<style>
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-sm) var(--space-md);
    margin: 0;
  }

  dt {
    font-weight: 700;
    white-space: nowrap;
  }

  dd {
    margin: 0;
  }

  .note {
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .closed {
    margin-top: var(--space-md);
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 3: `src/components/Header.astro` を作成**

現在地のリンクに `aria-current="page"` を付ける。`Astro.url.pathname` は末尾スラッシュ付きで来るため正規化する。

```astro
---
import { shop } from '../data/shop';

const navItems = [
  { href: '/menu', label: 'メニュー' },
  { href: '/access', label: '店舗情報' },
  { href: '/news', label: 'お知らせ' },
  { href: '/contact', label: 'お問い合わせ' },
];

const current = Astro.url.pathname.replace(/\/$/, '') || '/';
---

<header>
  <div class="inner">
    <a class="logo" href="/">{shop.name}</a>
    <nav aria-label="メインナビゲーション">
      <ul>
        {
          navItems.map((item) => (
            <li>
              <a
                href={item.href}
                aria-current={current === item.href || current.startsWith(item.href + '/') ? 'page' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>
  </div>
</header>

<style>
  header {
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-bg);
  }

  .inner {
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-md);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .logo {
    font-size: 1.1rem;
    font-weight: 700;
    text-decoration: none;
    color: var(--color-text);
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  nav a {
    text-decoration: none;
    font-size: 0.95rem;
  }

  nav a[aria-current='page'] {
    font-weight: 700;
    border-bottom: 2px solid var(--color-accent);
  }
</style>
```

- [ ] **Step 4: `src/components/Footer.astro` を作成**

```astro
---
import { shop } from '../data/shop';
import BusinessHours from './BusinessHours.astro';
import SnsLinks from './SnsLinks.astro';

const year = new Date().getFullYear();
---

<footer>
  <div class="inner">
    <div>
      <p class="name">{shop.name}</p>
      <p class="address">{shop.address}</p>
      <p class="tel">
        <a href={`tel:${shop.tel.replace(/-/g, '')}`}>{shop.tel}</a>
      </p>
      <SnsLinks />
    </div>
    <div>
      <BusinessHours />
    </div>
  </div>
  <p class="copyright">&copy; {year} {shop.name}</p>
</footer>

<style>
  footer {
    margin-top: var(--space-xl);
    border-top: 1px solid var(--color-border);
    padding: var(--space-lg) var(--space-md);
  }

  .inner {
    max-width: var(--max-width);
    margin-inline: auto;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .name {
    font-weight: 700;
  }

  .address,
  .tel {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .copyright {
    max-width: var(--max-width);
    margin: var(--space-lg) auto 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 5: `src/layouts/BaseLayout.astro` を作成**

JSON-LDは schema.org の `IceCreamShop` 型を使う（かき氷屋に最も近い型）。

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { shop } from '../data/shop';

type Props = {
  title: string;
  description?: string;
  ogImage?: string;
};

const { title, description = shop.description, ogImage = '/ogp.jpg' } = Astro.props;

const pageTitle = title === shop.name ? shop.name : `${title} | ${shop.name}`;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImageUrl = new URL(ogImage, Astro.site);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'IceCreamShop',
  name: shop.name,
  description: shop.description,
  address: shop.address,
  telephone: shop.tel,
  url: canonical.href,
  sameAs: Object.values(shop.sns).filter(Boolean),
};
---

<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="canonical" href={canonical.href} />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical.href} />
    <meta property="og:image" content={ogImageUrl.href} />
    <meta property="og:site_name" content={shop.name} />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} is:inline />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>

<style>
  main {
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-lg) var(--space-md);
  }
</style>
```

- [ ] **Step 6: `src/pages/index.astro` をBaseLayout経由に差し替えて表示確認**

Task 7で本実装に差し替えるまでの暫定。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { shop } from '../data/shop';
---

<BaseLayout title={shop.name}>
  <h1>{shop.name}</h1>
</BaseLayout>
```

- [ ] **Step 7: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 8: 目視確認**

Run: `npm run dev`
`http://localhost:4321/` を開き、ヘッダーのナビ4項目・フッターの営業時間とSNSリンクが表示され、ブラウザ幅を375pxまで狭めてもレイアウトが崩れないことを確認する。確認後Ctrl+Cで停止。

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "feat: 共通レイアウトとヘッダー・フッターを追加"
```

---

### Task 4: Content Collectionsの定義とサンプルコンテンツ

**Files:**
- Create: `src/content.config.ts`
- Create: `src/assets/images/menu/placeholder.svg`
- Create: `src/content/menu/uji-kintoki.md`
- Create: `src/content/menu/momo-milk.md`
- Create: `src/content/news/2026-07-01-summer-open.md`

**Interfaces:**
- Produces: コレクション `menu`（フィールド: `name`, `price`, `description`, `image`, `season`, `available`, `order`）
- Produces: コレクション `news`（フィールド: `title`, `date`, `category`, `draft`）。エントリの `id` は日付プレフィックスを除いたslug

- [ ] **Step 1: プレースホルダ画像を作成**

`src/assets/images/menu/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#e8f4f8" />
  <text x="400" y="310" font-family="sans-serif" font-size="40" fill="#4aa3c7" text-anchor="middle">写真準備中</text>
</svg>
```

- [ ] **Step 2: `src/content.config.ts` を作成**

`schema` を関数形式にすると `image()` ヘルパーが使える。`news` の `generateId` でファイル名の日付プレフィックスを除去し、slugをそのままURLにする。

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const menu = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/menu' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      price: z.number().int().positive(),
      description: z.string(),
      image: image(),
      season: z.enum(['all', 'spring', 'summer', 'autumn', 'winter']),
      available: z.boolean().default(true),
      order: z.number().int().default(100),
    }),
});

const news = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/news',
    // ファイル名 2026-07-01-summer-open.md → id "summer-open"
    generateId: ({ entry }) => entry.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['休業', '新メニュー', 'イベント', 'その他']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { menu, news };
```

- [ ] **Step 3: メニューのサンプルを2件作成**

`src/content/menu/uji-kintoki.md`:

```markdown
---
name: 宇治金時
price: 900
description: 京都・宇治の抹茶を濃いめに点てたシロップと、自家炊きの粒あん。
image: ../../assets/images/menu/placeholder.svg
season: all
available: true
order: 10
---

創業から変わらない定番です。抹茶は注文が入ってから点てています。
```

`src/content/menu/momo-milk.md`:

```markdown
---
name: 桃ミルク
price: 1200
description: 完熟した白桃をその日の朝に剥いて、練乳ミルクと合わせました。
image: ../../assets/images/menu/placeholder.svg
season: summer
available: true
order: 20
---

桃の入荷状況によってお休みする日があります。
```

- [ ] **Step 4: お知らせのサンプルを1件作成**

`src/content/news/2026-07-01-summer-open.md`:

```markdown
---
title: 夏季営業を開始しました
date: 2026-07-01
category: その他
draft: false
---

本日より夏季営業を開始しました。暑い日が続きますので、氷がなくなり次第閉店する場合があります。

最新の営業状況はInstagramでお知らせしています。
```

- [ ] **Step 5: スキーマが機能していることを確認（意図的に壊す）**

`src/content/menu/uji-kintoki.md` の `price: 900` を一時的に `price: "900円"` に変更する。

Run: `npm run build`
Expected: FAIL。`menu → uji-kintoki` のframtmatterで `price` が number でないという趣旨のエラーが出る

確認できたら `price: 900` に戻す。

- [ ] **Step 6: ビルドが通ることを確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: メニューとお知らせのコレクション定義を追加"
```

---

### Task 5: メニューページ

**Files:**
- Create: `src/components/MenuCard.astro`
- Create: `src/pages/menu.astro`

**Interfaces:**
- Consumes: コレクション `menu`（Task 4）、`BaseLayout`（Task 3）
- Produces: `MenuCard` — props `{ entry: CollectionEntry<'menu'> }`

- [ ] **Step 1: `src/components/MenuCard.astro` を作成**

画像は `astro:assets` の `Image` に通して圧縮・WebP変換させる。

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

type Props = {
  entry: CollectionEntry<'menu'>;
};

const { entry } = Astro.props;
const { name, price, description, image } = entry.data;
---

<article class="card">
  <Image src={image} alt={`${name}の写真`} width={400} height={300} />
  <div class="body">
    <h3>{name}</h3>
    <p class="price">{price.toLocaleString('ja-JP')}円<span class="tax">（税込）</span></p>
    <p class="description">{description}</p>
  </div>
</article>

<style>
  .card {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    background-color: #fff;
  }

  .card :global(img) {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .body {
    padding: var(--space-md);
  }

  h3 {
    font-size: 1.1rem;
  }

  .price {
    color: var(--color-accent-dark);
    font-weight: 700;
  }

  .tax {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--color-text-muted);
  }

  .description {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: `src/pages/menu.astro` を作成**

`available: false` の商品は除外し、通年と季節限定に分けて表示する。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import MenuCard from '../components/MenuCard.astro';

const all = (await getCollection('menu', ({ data }) => data.available)).sort(
  (a, b) => a.data.order - b.data.order
);

const regular = all.filter((entry) => entry.data.season === 'all');
const seasonal = all.filter((entry) => entry.data.season !== 'all');
---

<BaseLayout title="メニュー" description="かき氷のメニューと価格のご案内です。">
  <h1>メニュー</h1>

  <section>
    <h2>定番</h2>
    <div class="grid">
      {regular.map((entry) => <MenuCard entry={entry} />)}
    </div>
  </section>

  {
    seasonal.length > 0 && (
      <section>
        <h2>季節限定</h2>
        <div class="grid">
          {seasonal.map((entry) => (
            <MenuCard entry={entry} />
          ))}
        </div>
      </section>
    )
  }

  <p class="note">仕入れの都合により、提供できない場合があります。</p>
</BaseLayout>

<style>
  section {
    margin-top: var(--space-xl);
  }

  h2 {
    font-size: 1.3rem;
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid var(--color-accent);
    margin-bottom: var(--space-lg);
  }

  .grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }

  .note {
    margin-top: var(--space-lg);
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 3: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 4: 目視確認**

Run: `npm run dev`
`http://localhost:4321/menu` を開き、「定番」に宇治金時、「季節限定」に桃ミルクが出ること、価格が「900円（税込）」の形式で出ることを確認。確認後Ctrl+Cで停止。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: メニューページを追加"
```

---

### Task 6: お知らせ一覧と詳細

**Files:**
- Create: `src/components/NewsList.astro`
- Create: `src/layouts/NewsLayout.astro`
- Create: `src/pages/news/index.astro`
- Create: `src/pages/news/[slug].astro`

**Interfaces:**
- Consumes: コレクション `news`（Task 4）、`BaseLayout`（Task 3）
- Produces: `NewsList` — props `{ entries: CollectionEntry<'news'>[]; limit?: number }`。トップページ（Task 7）が `limit={3}` で再利用する
- Produces: 日付整形は各所で必要になるため `NewsList` と `NewsLayout` の両方で `toLocaleDateString('ja-JP')` を使い、表記を「2026年7月1日」に揃える

- [ ] **Step 1: `src/components/NewsList.astro` を作成**

```astro
---
import type { CollectionEntry } from 'astro:content';

type Props = {
  entries: CollectionEntry<'news'>[];
  limit?: number;
};

const { entries, limit } = Astro.props;
const items = limit ? entries.slice(0, limit) : entries;

const formatDate = (date: Date) =>
  date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
---

{
  items.length === 0 ? (
    <p class="empty">お知らせはまだありません。</p>
  ) : (
    <ul class="list">
      {items.map((entry) => (
        <li>
          <a href={`/news/${entry.id}`}>
            <time datetime={entry.data.date.toISOString()}>{formatDate(entry.data.date)}</time>
            <span class="category">{entry.data.category}</span>
            <span class="title">{entry.data.title}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

<style>
  .list li + li {
    border-top: 1px solid var(--color-border);
  }

  .list a {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm) var(--space-md);
    padding: var(--space-md) 0;
    text-decoration: none;
    color: var(--color-text);
  }

  .list a:hover .title {
    text-decoration: underline;
  }

  time {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .category {
    font-size: 0.75rem;
    padding: 0.1rem 0.6rem;
    border: 1px solid var(--color-accent);
    border-radius: 999px;
    color: var(--color-accent-dark);
  }

  .title {
    flex: 1 1 100%;
  }

  @media (min-width: 640px) {
    .title {
      flex: 1;
    }
  }

  .empty {
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: `src/layouts/NewsLayout.astro` を作成**

```astro
---
import BaseLayout from './BaseLayout.astro';
import type { CollectionEntry } from 'astro:content';

type Props = {
  entry: CollectionEntry<'news'>;
};

const { entry } = Astro.props;
const { title, date, category } = entry.data;

const formatDate = (value: Date) =>
  value.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
---

<BaseLayout title={title} description={`${formatDate(date)}のお知らせ`}>
  <article>
    <header>
      <p class="meta">
        <time datetime={date.toISOString()}>{formatDate(date)}</time>
        <span class="category">{category}</span>
      </p>
      <h1>{title}</h1>
    </header>
    <div class="body">
      <slot />
    </div>
    <p class="back"><a href="/news">お知らせ一覧に戻る</a></p>
  </article>
</BaseLayout>

<style>
  .meta {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .category {
    padding: 0.1rem 0.6rem;
    border: 1px solid var(--color-accent);
    border-radius: 999px;
    color: var(--color-accent-dark);
  }

  h1 {
    font-size: 1.6rem;
    margin-top: var(--space-sm);
  }

  .body {
    margin-top: var(--space-lg);
  }

  .body :global(p + p) {
    margin-top: var(--space-md);
  }

  .back {
    margin-top: var(--space-xl);
  }
</style>
```

- [ ] **Step 3: `src/pages/news/index.astro` を作成**

下書きは本番ビルドでのみ除外する（開発中は確認できるようにする）。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import NewsList from '../../components/NewsList.astro';

const entries = (await getCollection('news', ({ data }) => import.meta.env.PROD ? !data.draft : true))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="お知らせ" description="営業日の変更や新メニューのお知らせです。">
  <h1>お知らせ</h1>
  <NewsList entries={entries} />
</BaseLayout>
```

- [ ] **Step 4: `src/pages/news/[slug].astro` を作成**

Astro 5以降、本文の描画は `entry.render()` ではなく `astro:content` の `render(entry)` を使う。

```astro
---
import { getCollection, render } from 'astro:content';
import type { GetStaticPaths } from 'astro';
import NewsLayout from '../../layouts/NewsLayout.astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('news', ({ data }) => import.meta.env.PROD ? !data.draft : true);
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<NewsLayout entry={entry}>
  <Content />
</NewsLayout>
```

- [ ] **Step 5: ビルドと型チェック**

Run: `npm run build`
Expected: 成功し、`dist/news/index.html` と `dist/news/summer-open/index.html` が生成される（日付プレフィックスが除去されたURLになっていること）

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 6: 目視確認**

Run: `npm run dev`
`http://localhost:4321/news` で一覧に1件出ること、タイトルをクリックして `/news/summer-open` に遷移し本文が表示されること、「お知らせ一覧に戻る」が機能することを確認。確認後Ctrl+Cで停止。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: お知らせの一覧と詳細ページを追加"
```

---

### Task 7: トップページ

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/assets/images/shop/hero-placeholder.svg`
- Modify: `src/pages/index.astro`（Task 3の暫定内容を全面的に差し替え）

**Interfaces:**
- Consumes: `MenuCard`（Task 5）、`NewsList`（Task 6）、`BusinessHours`（Task 3）、`shop`（Task 2）
- Produces: `Hero` — props なし。`shop` の店名と説明文を読む

- [ ] **Step 1: ヒーロー用プレースホルダ画像を作成**

`src/assets/images/shop/hero-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <rect width="1600" height="900" fill="#dcedf4" />
  <text x="800" y="465" font-family="sans-serif" font-size="64" fill="#2f7d9c" text-anchor="middle">メイン写真準備中</text>
</svg>
```

- [ ] **Step 2: `src/components/Hero.astro` を作成**

```astro
---
import { Image } from 'astro:assets';
import { shop } from '../data/shop';
import heroImage from '../assets/images/shop/hero-placeholder.svg';
---

<section class="hero">
  <Image src={heroImage} alt="" width={1600} height={900} loading="eager" />
  <div class="text">
    <h1>{shop.name}</h1>
    <p>{shop.description}</p>
  </div>
</section>

<style>
  .hero :global(img) {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 12px;
  }

  .text {
    margin-top: var(--space-lg);
    text-align: center;
  }

  h1 {
    font-size: 1.8rem;
  }

  .text p {
    margin-top: var(--space-sm);
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 3: `src/pages/index.astro` を全面的に差し替え**

看板メニューは `order` の小さい順に3件。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import MenuCard from '../components/MenuCard.astro';
import NewsList from '../components/NewsList.astro';
import BusinessHours from '../components/BusinessHours.astro';
import { shop } from '../data/shop';

const featuredMenu = (await getCollection('menu', ({ data }) => data.available))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 3);

const news = (await getCollection('news', ({ data }) => import.meta.env.PROD ? !data.draft : true))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title={shop.name}>
  <Hero />

  <section>
    <h2>おすすめ</h2>
    <div class="grid">
      {featuredMenu.map((entry) => <MenuCard entry={entry} />)}
    </div>
    <p class="more"><a href="/menu">メニューをすべて見る</a></p>
  </section>

  <section>
    <h2>お知らせ</h2>
    <NewsList entries={news} limit={3} />
    <p class="more"><a href="/news">お知らせをすべて見る</a></p>
  </section>

  <section>
    <h2>営業時間</h2>
    <BusinessHours />
    <p class="more"><a href="/access">店舗情報・アクセス</a></p>
  </section>
</BaseLayout>

<style>
  section {
    margin-top: var(--space-xl);
  }

  h2 {
    font-size: 1.3rem;
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid var(--color-accent);
    margin-bottom: var(--space-lg);
  }

  .grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }

  .more {
    margin-top: var(--space-lg);
    text-align: right;
    font-size: 0.9rem;
  }
</style>
```

- [ ] **Step 4: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 5: 目視確認**

Run: `npm run dev`
`http://localhost:4321/` でヒーロー、おすすめ2件、お知らせ1件、営業時間が並ぶことを確認。確認後Ctrl+Cで停止。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: トップページを追加"
```

---

### Task 8: 店舗情報・アクセスページとお問い合わせページ

2ページとも `shop.ts` を読んで整形するだけの静的ページで、テスト観点も同じため1タスクにまとめる。

**Files:**
- Create: `src/pages/access.astro`
- Create: `src/pages/contact.astro`

**Interfaces:**
- Consumes: `shop`（Task 2）、`BusinessHours`（Task 3）、`SnsLinks`（Task 3）、`BaseLayout`（Task 3）

- [ ] **Step 1: `src/pages/access.astro` を作成**

地図はGoogleマップのiframe埋め込み。`loading="lazy"` を付けて初期表示を軽くする。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import BusinessHours from '../components/BusinessHours.astro';
import { shop } from '../data/shop';
---

<BaseLayout title="店舗情報・アクセス" description={`${shop.name}の住所、営業時間、アクセス方法のご案内です。`}>
  <h1>店舗情報・アクセス</h1>

  <dl class="info">
    <dt>店名</dt>
    <dd>{shop.name}</dd>

    <dt>住所</dt>
    <dd>
      {shop.address}
      <a href={shop.mapUrl} target="_blank" rel="noopener noreferrer">地図を開く</a>
    </dd>

    <dt>電話番号</dt>
    <dd><a href={`tel:${shop.tel.replace(/-/g, '')}`}>{shop.tel}</a></dd>

    <dt>営業時間</dt>
    <dd><BusinessHours /></dd>

    <dt>駐車場</dt>
    <dd>{shop.parking}</dd>

    <dt>支払い方法</dt>
    <dd>{shop.payments.join(' / ')}</dd>
  </dl>

  <section class="map">
    <h2>地図</h2>
    <iframe
      src={shop.mapEmbedUrl}
      title={`${shop.name}の地図`}
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen></iframe>
  </section>
</BaseLayout>

<style>
  .info {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .info dt {
    font-weight: 700;
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border);
  }

  .info dd {
    margin: 0 0 var(--space-md);
  }

  @media (min-width: 640px) {
    .info {
      grid-template-columns: 8rem 1fr;
      column-gap: var(--space-lg);
    }

    .info dd {
      padding-top: var(--space-md);
      border-top: 1px solid var(--color-border);
      margin-bottom: 0;
    }
  }

  .map {
    margin-top: var(--space-xl);
  }

  .map h2 {
    font-size: 1.3rem;
    margin-bottom: var(--space-md);
  }

  iframe {
    width: 100%;
    height: 360px;
    border: 0;
    border-radius: 12px;
  }
</style>
```

- [ ] **Step 2: `src/pages/contact.astro` を作成**

設計書の通りフォームのバックエンドは作らない。メールとSNSへの導線のみ。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SnsLinks from '../components/SnsLinks.astro';
import { shop } from '../data/shop';

const mailSubject = encodeURIComponent('お問い合わせ');
---

<BaseLayout title="お問い合わせ" description="ご質問、イベント出店のご依頼はこちらから。">
  <h1>お問い合わせ</h1>

  <p>
    メニューについてのご質問、イベント出店や販売のご依頼は、メールまたはSNSのメッセージでご連絡ください。
    営業時間中は店舗対応のため、返信までお時間をいただくことがあります。
  </p>

  <section>
    <h2>メール</h2>
    <p><a href={`mailto:${shop.email}?subject=${mailSubject}`}>{shop.email}</a></p>
  </section>

  <section>
    <h2>SNS</h2>
    <SnsLinks />
  </section>

  <section>
    <h2>お電話</h2>
    <p><a href={`tel:${shop.tel.replace(/-/g, '')}`}>{shop.tel}</a></p>
  </section>

  <section>
    <h2>イベント出店のご依頼</h2>
    <p>
      出店日時、場所、想定人数、電源と給水の有無をあわせてお知らせいただけると、
      お返事がスムーズです。
    </p>
  </section>
</BaseLayout>

<style>
  section {
    margin-top: var(--space-xl);
  }

  h2 {
    font-size: 1.2rem;
    padding-bottom: var(--space-sm);
    border-bottom: 2px solid var(--color-accent);
    margin-bottom: var(--space-md);
  }
</style>
```

- [ ] **Step 3: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 4: 目視確認**

Run: `npm run dev`
`http://localhost:4321/access` で地図が表示されること、`http://localhost:4321/contact` のメールリンクが `mailto:` で開くことを確認。375px幅で定義リストが1カラムに落ちることも確認。確認後Ctrl+Cで停止。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: 店舗情報とお問い合わせページを追加"
```

---

### Task 9: 404ページ、静的アセット、仕上げ

**Files:**
- Create: `src/pages/404.astro`
- Create: `public/favicon.svg`
- Create: `public/ogp.jpg`（プレースホルダとしてSVGではなく後述の方法で用意）
- Create: `public/robots.txt`
- Create: `README.md`

- [ ] **Step 1: `src/pages/404.astro` を作成**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="ページが見つかりません">
  <h1>ページが見つかりません</h1>
  <p>お探しのページは移動または削除された可能性があります。</p>
  <p><a href="/">トップページに戻る</a></p>
</BaseLayout>
```

- [ ] **Step 2: `public/favicon.svg` を作成**

かき氷を模した簡易アイコン。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <path d="M6 14 L16 3 L26 14 Z" fill="#bfe6f2" />
  <path d="M8 15 h16 l-6 13 h-4 Z" fill="#f5f2ea" stroke="#d8d2c6" stroke-width="0.8" />
  <circle cx="16" cy="10" r="2.4" fill="#4aa3c7" />
</svg>
```

- [ ] **Step 3: `public/ogp.jpg` を用意**

現時点で実写のOGP画像はない。**JPEGをテキストで捏造することはできない**ため、この手順ではプレースホルダを配置せず、`public/ogp.png` としてSVGから変換した画像を作る代わりに、以下で対応する。

`BaseLayout.astro` のOGP既定値を `/ogp.jpg` から `/ogp.svg` に変更し、`public/ogp.svg` を作成する。

`public/ogp.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#dcedf4" />
  <text x="600" y="330" font-family="sans-serif" font-size="72" fill="#2f7d9c" text-anchor="middle">かき氷店（仮）</text>
</svg>
```

`src/layouts/BaseLayout.astro` の該当行を変更:

```diff
-const { title, description = shop.description, ogImage = '/ogp.jpg' } = Astro.props;
+// TODO: 店舗写真が用意でき次第、1200x630のJPEG/PNGに差し替える（SVGはOGPでサムネイル表示されないSNSがある）
+const { title, description = shop.description, ogImage = '/ogp.svg' } = Astro.props;
```

- [ ] **Step 4: `public/robots.txt` を作成**

```
User-agent: *
Allow: /
```

- [ ] **Step 5: `README.md` を作成**

更新手順は店主から連絡を受けた自分が読むもの。具体的なコマンドと手順を書く。

````markdown
# かき氷店HP

Astroで作った店舗紹介サイト。

## 開発

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に静的ファイルを出力
npm run check    # 型チェック
```

## メニューを追加する

1. `src/assets/images/menu/` に写真を置く（スマホ撮影のまま可。ビルド時に自動圧縮される）
2. `src/content/menu/` に `<商品名のローマ字>.md` を作る

```markdown
---
name: いちごミルク
price: 1000
description: 説明文
image: ../../assets/images/menu/ichigo.jpg
season: winter   # all | spring | summer | autumn | winter
available: true
order: 30        # 小さいほど上に出る
---

本文（任意）
```

3. `npm run build` が通れば反映OK。項目の書き忘れや型違いはここで検出される

**提供を一時停止したいとき:** ファイルを消さず `available: false` にする。

## お知らせを投稿する

`src/content/news/` に `YYYY-MM-DD-<slug>.md` を作る。URLは日付を除いた `/news/<slug>` になる。

```markdown
---
title: 臨時休業のお知らせ
date: 2026-08-12
category: 休業   # 休業 | 新メニュー | イベント | その他
draft: false     # true にすると本番ビルドから除外される
---

本文
```

## 店舗情報を変更する

住所・電話番号・営業時間・SNSは `src/data/shop.ts` の1ファイルだけを編集する。
トップ、アクセス、フッター、構造化データの全てがここを参照している。

## 未対応事項

- `astro.config.mjs` の `site` が `https://example.com` のまま。独自ドメイン取得後に差し替える
- `src/data/shop.ts` の店舗情報がプレースホルダ
- `public/ogp.svg` が仮画像。SNSシェア時のサムネイル用に1200x630のJPEGへ差し替える
````

- [ ] **Step 6: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 7: 全ページの最終確認**

Run: `npm run preview`
以下のURLを順に開き、ヘッダー・フッターが全ページに出ること、ナビの現在地表示が正しいこと、404が表示されることを確認する。

- `http://localhost:4321/`
- `http://localhost:4321/menu`
- `http://localhost:4321/access`
- `http://localhost:4321/news`
- `http://localhost:4321/news/summer-open`
- `http://localhost:4321/contact`
- `http://localhost:4321/存在しないページ`

確認後Ctrl+Cで停止。

- [ ] **Step 8: 単一情報源が機能しているか確認**

`src/data/shop.ts` の `businessHours` の平日の `close` を一時的に `'17:00'` に変更する。

Run: `npm run build`
`dist/index.html`、`dist/access/index.html`、`dist/menu/index.html`（フッター）の3ファイルすべてで `17:00` に変わっていることを確認する。

Run: `npx serve dist` は不要。ファイル内容の確認でよい。

確認後 `'18:00'` に戻し、`npm run build` を再実行する。

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "feat: 404ページと静的アセット、READMEを追加"
```

---

## Self-Review 結果

**仕様カバレッジ:** 設計書の全セクションを確認した。ページ構成7URL（Task 5,6,7,8,9）、メニュースキーマ7項目（Task 4）、お知らせスキーマ4項目（Task 4）、shop.ts単一情報源（Task 2、検証はTask 9 Step 8）、コンポーネント設計6種（Task 3,5,6,7）、画像の使い分け（Task 4,7）、ビルド時検証（Task 4 Step 5）、スコープ外項目（いずれも未実装のまま）。成功基準4項目はTask 9 Step 7・8で検証される。

**未カバーだったため追加した項目:** 設計書のコンポーネント一覧にある `Hero` はTask 7で、`SnsLinks` はTask 3で実装するよう配置した。

**既知の仕様からの逸脱:** 設計書はOGP画像を `public/ogp.jpg` としているが、実写素材がないためTask 9で `ogp.svg` の仮画像に変更し、差し替えTODOをREADMEに記載する。
