# White Project HP 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** かき氷専門店 White Project の紹介サイト（静的6ページ + お知らせ詳細）をAstroで構築する。間借り営業で曜日ごとに出店先が変わるため、「今日どこにいるか」がトップで分かることを最優先にする。

**Architecture:** Astro 6の静的サイト生成。メニューとお知らせはContent Collections（Markdown + zod）。会場・連絡先は `src/data/shop.ts` を唯一の情報源とする。UIコンポーネントはpropsを表示するだけに徹し、データ取得はページ側で行う。唯一の例外が「本日の出店」で、曜日判定のみクライアント側の小さなスクリプトで行う。

**Tech Stack:** Astro 7（Task 1で7.1.4を導入済み）、TypeScript（strict）、素のCSS（フレームワークなし）、Astro Image（`astro:assets`）、Google Fonts

## Global Constraints

- 仕様の正は `docs/superpowers/specs/2026-07-28-kakigori-site-design.md`。デザイン方針の節を必ず読んでから実装すること
- 作業ディレクトリは `C:\Users\yuuya\test_prj\kakigori-site`（Git初期化済み、`main`、spec/planはcommit済み）
- **自動テストは書かない**（設計書のスコープ外）。検証は毎タスク `npm run build` の成功と `npx astro check` の `0 errors`、および指定URLの目視確認で行う
- **カラーはこの5つ以外を使わない。** `--paper:#FCFDFD` / `--ice:#5ABDDD` / `--ice-deep:#1C6B85` / `--mist:#E4F2F8` / `--sumi:#1B2328`（+ `--sumi-soft:#5A656B`）。彩度のある色はメニュー写真からのみ出す
- **`--ice` を文字色に使わない。** 白地とのコントラスト比が2.1しかない。文字に青が要るときは `--ice-deep` を使う
- **枠線付きの角丸カードを作らない。** 区切りは余白で行う。`border-radius` は写真とロゴにのみ許可
- **縦組み（`writing-mode: vertical-rl`）を使うのはヒーローのコピーとメニューの商品名の2箇所だけ。** それ以外は横組み
- 書体の役割: 見出し・縦組み＝`--font-display`（Shippori Mincho） / 本文＝`--font-body`（Zen Kaku Gothic New） / **数字・欧文ラベル＝`--font-latin`（Jost）**。価格・時刻・曜日は必ずJostで組む
- 全アニメーションは `@media (prefers-reduced-motion: reduce)` で無効化する
- 店舗の実データ（住所・価格・定休日）は未確定。プレースホルダを置き `// TODO: 店主に確認` を残す
- 375px幅で破綻しないこと
- コミットは各タスク末尾。メッセージは日本語、Conventional Commitsのprefix付き

### Astro 7 固有の注意（Task 1で7.1.4が入った。必ず守る）

計画のコード例はAstro 6のAPIで検証したものだが、Content Collections（`glob` loader、`schema: ({ image }) => ...`、`getCollection`、`render(entry)`、`entry.id`）はAstro 7でも変更されていない。そのまま使ってよい。以下の2点だけAstro 7で挙動が変わる。

1. **Rustコンパイラが唯一のコンパイラになり、不正なHTMLでビルドが落ちる。** 閉じタグの省略は自動補正されずエラーになる。**void要素以外を自己終了タグで書かないこと。** 特に `<script>` は void 要素ではないため `<script ... />` は不可。必ず `<script ...></script>` と閉じる。`<Image />` などAstroコンポーネントの自己終了は従来どおり可。
2. **`compressHTML` の既定値が `'jsx'` になり、行間の空白がJSXの規則で除去される。** 式と式の間に置いた区切り文字の前後の空白は消える。`{a} – {b}` のように**空白を意味的に使う箇所は1行に収めるか、`{' '}` で明示する**こと。改行して書くと `18:30–21:30` のように空白が落ちる。

## 配置済みアセット

以下は既にリポジトリにある。作成不要。

- `src/assets/images/brand/logo-on-white.png`（150x150、白地に青ロゴ。**ヘッダーで使う**）
- `src/assets/images/brand/logo-on-blue.png`（870x1022、青地に白ロゴ）
- `docs/design-reference/bollina-reference.png`（デザイン参考。実装には使わない）

---

## File Structure

| ファイル | 責務 |
|---|---|
| `src/styles/global.css` | デザイントークン、リセット、タイポグラフィ、縦組みユーティリティ |
| `src/data/shop.ts` | 屋号・連絡先・SNS・**会場配列**の唯一の情報源 |
| `src/content.config.ts` | menu / news のloaderとzodスキーマ |
| `src/layouts/BaseLayout.astro` | head、フォント読み込み、OGP、JSON-LD、Header/Footer |
| `src/layouts/NewsLayout.astro` | お知らせ詳細の本文枠 |
| `src/components/Header.astro` | 中央ロゴ + ナビ |
| `src/components/Footer.astro` | 会場要約とSNS |
| `src/components/SnsLinks.astro` | SNSリンク |
| `src/components/SectionHeading.astro` | Jostのラベル + 日本語見出し。全セクション共通 |
| `src/components/TodayVenue.astro` | シグネチャー要素。曜日で出店先を出し分ける |
| `src/components/VenueCard.astro` | 会場1件の表示 |
| `src/components/Hero.astro` | 全幅グラデーション + 縦組みコピー |
| `src/components/MenuCard.astro` | 縦長写真 + 縦組みの商品名 |
| `src/components/NewsList.astro` | お知らせ一覧。件数上限をpropsで受ける |
| `src/pages/*.astro` | ルーティングとデータ取得 |

---

### Task 1: プロジェクト初期化とデザイントークン

対話式スキャフォールド（`npm create astro@latest`）は使わない。既存の `docs/` と `.git/` があるため非空ディレクトリの確認プロンプトで自動実行が止まる。手動でセットアップする。

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`
- Create: `src/styles/global.css`
- Create: `src/pages/index.astro`（動作確認用の最小内容。Task 8で差し替え）

**Interfaces:**
- Produces: CSS変数群。以降の全コンポーネントがこれだけを参照して色・間隔・書体を決める
- Produces: `.u-vertical` — 縦組みユーティリティ
- Produces: `.u-label` — Jostのwide trackingラベル

- [ ] **Step 1: `package.json` を作成**

```json
{
  "name": "white-project-site",
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

- [ ] **Step 3: `astro.config.mjs` を作成**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO: 独自ドメイン取得後に実URLへ差し替え。OGPとcanonicalの絶対URL生成に使う
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

トークンと最小限のリセットのみ。レイアウトは書かない。

```css
:root {
  /* 色 — この6つ以外を使わない */
  --paper: #fcfdfd;
  --ice: #5abddd;
  --ice-deep: #1c6b85;
  --mist: #e4f2f8;
  --sumi: #1b2328;
  --sumi-soft: #5a656b;

  /* 書体 */
  --font-display: "Shippori Mincho", "Yu Mincho", "YuMincho", serif;
  --font-body: "Zen Kaku Gothic New", "Hiragino Sans", "Noto Sans JP", sans-serif;
  --font-latin: "Jost", "Helvetica Neue", system-ui, sans-serif;

  /* 余白 — 枠線ではなくこれで区切る */
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.75rem;
  --space-lg: 3rem;
  --space-xl: 6rem;
  --space-2xl: 9rem;

  --measure: 34rem;
  --max-width: 1100px;
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
dl,
dd,
ul {
  margin: 0;
}

ul {
  padding: 0;
  list-style: none;
}

html {
  color-scheme: light;
  scroll-behavior: smooth;
}

body {
  background-color: var(--paper);
  color: var(--sumi);
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.95;
  letter-spacing: 0.04em;
  -webkit-font-smoothing: antialiased;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--ice-deep);
  outline-offset: 3px;
}

/* 縦組み。ヒーローのコピーとメニューの商品名でのみ使う */
.u-vertical {
  writing-mode: vertical-rl;
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.28em;
}

/* セクションの英字ラベル。Jostのwide tracking */
.u-label {
  font-family: var(--font-latin);
  font-weight: 400;
  font-size: 0.7rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--ice-deep);
}

/* 数字・時刻・価格はすべてJost */
.u-num {
  font-family: var(--font-latin);
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 7: 動作確認用の `src/pages/index.astro` を作成**

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

- [ ] **Step 8: ビルドと型チェック**

Run: `npm run build`
Expected: 成功し `dist/index.html` が生成される

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "chore: Astroプロジェクトを初期化しデザイントークンを定義"
```

---

### Task 2: 会場データを含む単一情報源

**Files:**
- Create: `src/data/shop.ts`

**Interfaces:**
- Produces: `export const shop` — `name`, `nameJa`, `tagline`, `description`, `email`, `payments`, `sns`, `venues`
- Produces: `export type Venue = { id, name, days, daysLabel, open, close, address, mapUrl, mapEmbedUrl, note? }`
- `days` は `0=日曜〜6=土曜`。Task 5の「本日の出店」判定がこの配列を使う

- [ ] **Step 1: `src/data/shop.ts` を作成**

Instagramから読み取った暫定情報を入れる。住所は未確認のためプレースホルダ。

```ts
export type Venue = {
  /** アンカーリンクとdata属性に使う識別子 */
  id: string;
  /** 間借り先の名前 */
  name: string;
  /** 出店曜日。0=日曜, 1=月曜, ... 6=土曜 */
  days: number[];
  /** 表示用の曜日ラベル。例: "月〜土" */
  daysLabel: string;
  /** 開始時刻。例: "18:30" */
  open: string;
  /** 終了時刻。例: "21:30" */
  close: string;
  address: string;
  /** Googleマップの共有リンク */
  mapUrl: string;
  /** Googleマップの埋め込み用URL */
  mapEmbedUrl: string;
  note?: string;
};

const mapLinks = (query: string) => ({
  mapUrl: `https://maps.google.com/?q=${encodeURIComponent(query)}`,
  mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
});

// TODO: 店主に確認 — 各会場の正確な住所、定休日、支払い方法
export const venues: Venue[] = [
  {
    id: 'akawani',
    name: '赤鰐',
    days: [1, 2, 3, 4, 5, 6],
    daysLabel: '月〜土',
    open: '18:30',
    close: '21:30',
    address: '愛知県名古屋市（住所確認中）',
    ...mapLinks('赤鰐 名古屋'),
    note: '夜の営業です。氷がなくなり次第終了します。',
  },
  {
    id: 'kakaoc',
    name: 'cafe KAKAOc',
    days: [0],
    daysLabel: '日曜',
    open: '12:00',
    close: '19:00',
    address: '愛知県名古屋市（住所確認中）',
    ...mapLinks('cafe KAKAOc 名古屋'),
  },
];

export const shop = {
  name: 'White Project',
  nameJa: 'かき氷専門店 White Project',
  tagline: '白の上に、季節を。',
  description:
    '名古屋で間借り営業しているかき氷専門店です。曜日によって出店場所が変わります。その日の果実を削りたての氷にのせてお出しします。',
  // TODO: 店主に確認 — 問い合わせ用のメールアドレス
  email: 'info@example.com',
  payments: ['現金', 'PayPay'],
  sns: {
    instagram: 'https://www.instagram.com/whiteproject_kakigori/',
    threads: 'https://www.threads.net/@whiteproject_kakigori',
  },
  venues,
};
```

- [ ] **Step 2: 型チェック**

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 3: コミット**

```bash
git add src/data/shop.ts
git commit -m "feat: 会場データを含む店舗情報の単一情報源を追加"
```

---

### Task 3: 共通レイアウト

**Files:**
- Create: `src/components/SnsLinks.astro`
- Create: `src/components/SectionHeading.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`（Task 1の暫定内容を差し替え。Task 8で本実装にする）

**Interfaces:**
- Consumes: `shop`, `venues`（Task 2）
- Produces: `BaseLayout` — props `{ title: string; description?: string; ogImage?: string; wide?: boolean }`。`wide` が true のとき `<main>` の左右パディングと最大幅を外す（ヒーローを全幅にするため）
- Produces: `SectionHeading` — props `{ label: string; title: string }`。`label` はJostの英字、`title` は日本語見出し
- Produces: `SnsLinks` — props なし

- [ ] **Step 1: `src/components/SnsLinks.astro` を作成**

```astro
---
import { shop } from '../data/shop';

const links = [
  { label: 'Instagram', url: shop.sns.instagram },
  { label: 'Threads', url: shop.sns.threads },
].filter((link) => Boolean(link.url));
---

<ul class="sns">
  {
    links.map((link) => (
      <li>
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          {link.label}
          <span aria-hidden="true">↗</span>
        </a>
      </li>
    ))
  }
</ul>

<style>
  .sns {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  a {
    font-family: var(--font-latin);
    font-weight: 300;
    font-size: 0.85rem;
    letter-spacing: 0.16em;
    text-decoration: none;
    color: var(--ice-deep);
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }

  a span {
    font-size: 0.7em;
    transition: transform 0.3s ease;
  }

  a:hover span {
    transform: translate(2px, -2px);
  }
</style>
```

- [ ] **Step 2: `src/components/SectionHeading.astro` を作成**

英字ラベルの下に細いヘアラインを引く。これがサイト唯一の罫線用途。

```astro
---
type Props = {
  label: string;
  title: string;
};

const { label, title } = Astro.props;
---

<div class="heading">
  <p class="u-label">{label}</p>
  <h2>{title}</h2>
</div>

<style>
  .heading {
    margin-bottom: var(--space-lg);
  }

  h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.35rem, 3vw, 1.75rem);
    letter-spacing: 0.16em;
    margin-top: var(--space-2xs);
  }
</style>
```

- [ ] **Step 3: `src/components/Header.astro` を作成**

中央にロゴ、左にナビ。参考サイトに倣い、地は塗らず透過させる。

```astro
---
import { Image } from 'astro:assets';
import logo from '../assets/images/brand/logo-on-white.png';
import { shop } from '../data/shop';

const navItems = [
  { href: '/menu', label: 'メニュー' },
  { href: '/venues', label: '出店情報' },
  { href: '/news', label: 'お知らせ' },
  { href: '/contact', label: 'お問い合わせ' },
];

const current = Astro.url.pathname.replace(/\/$/, '') || '/';
---

<header>
  <nav aria-label="メインナビゲーション">
    <ul>
      {
        navItems.map((item) => (
          <li>
            <a
              href={item.href}
              aria-current={
                current === item.href || current.startsWith(item.href + '/') ? 'page' : undefined
              }
            >
              {item.label}
            </a>
          </li>
        ))
      }
    </ul>
  </nav>

  <a class="logo" href="/" aria-label={`${shop.name} トップページ`}>
    <Image src={logo} alt={shop.name} width={104} height={104} loading="eager" />
  </a>
</header>

<style>
  header {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-sm);
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-sm) var(--space-md);
  }

  .logo {
    grid-column: 2;
    justify-self: center;
    order: -1;
  }

  .logo :global(img) {
    width: clamp(56px, 9vw, 76px);
    height: auto;
  }

  nav {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-sm) var(--space-md);
  }

  nav a {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-decoration: none;
    color: var(--sumi-soft);
    padding-bottom: 0.2em;
    transition: color 0.3s ease;
  }

  nav a:hover {
    color: var(--sumi);
  }

  nav a[aria-current='page'] {
    color: var(--sumi);
    border-bottom: 1px solid var(--ice);
  }

  /* 広い画面では左にナビ、中央にロゴの1行組みにする */
  @media (min-width: 900px) {
    header {
      padding-block: var(--space-md);
    }

    nav {
      grid-column: 1;
      grid-row: 1;
    }

    nav ul {
      justify-content: flex-start;
    }

    .logo {
      order: 0;
    }
  }
</style>
```

- [ ] **Step 4: `src/components/Footer.astro` を作成**

```astro
---
import SnsLinks from './SnsLinks.astro';
import { shop } from '../data/shop';

const year = new Date().getFullYear();
---

<footer>
  <div class="inner">
    <div>
      <p class="name">{shop.nameJa}</p>
      <p class="tagline">{shop.tagline}</p>
      <SnsLinks />
    </div>

    <dl class="venues">
      {
        shop.venues.map((venue) => (
          <div>
            <dt>{venue.name}</dt>
            <dd class="u-num">{venue.daysLabel}　{venue.open}–{venue.close}</dd>
          </div>
        ))
      }
    </dl>
  </div>

  <p class="copyright u-num">&copy; {year} {shop.name}</p>
</footer>

<style>
  footer {
    margin-top: var(--space-2xl);
    padding: var(--space-xl) var(--space-md) var(--space-lg);
    background: linear-gradient(180deg, var(--paper) 0%, var(--mist) 100%);
  }

  .inner {
    max-width: var(--max-width);
    margin-inline: auto;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .name {
    font-family: var(--font-display);
    letter-spacing: 0.16em;
  }

  .tagline {
    color: var(--sumi-soft);
    font-size: 0.85rem;
    margin-bottom: var(--space-sm);
  }

  .venues {
    display: grid;
    gap: var(--space-sm);
    align-content: start;
  }

  .venues dt {
    font-size: 0.9rem;
    letter-spacing: 0.12em;
  }

  .venues dd {
    font-size: 0.85rem;
    color: var(--sumi-soft);
  }

  .copyright {
    max-width: var(--max-width);
    margin: var(--space-xl) auto 0;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--sumi-soft);
  }
</style>
```

- [ ] **Step 5: `src/layouts/BaseLayout.astro` を作成**

間借り営業のため構造化データに単一の住所は書かない。`areaServed` で地域を示す。

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
  /** ヒーローなど全幅要素を置くページで true にする */
  wide?: boolean;
};

const { title, description = shop.description, ogImage = '/ogp.svg', wide = false } = Astro.props;

const pageTitle = title === shop.name ? `${shop.nameJa}` : `${title} | ${shop.name}`;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImageUrl = new URL(ogImage, Astro.site);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'IceCreamShop',
  name: shop.nameJa,
  alternateName: shop.name,
  description: shop.description,
  url: canonical.href,
  areaServed: '愛知県名古屋市',
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

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400&family=Shippori+Mincho&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap"
      rel="stylesheet"
    />

    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical.href} />
    <meta property="og:image" content={ogImageUrl.href} />
    <meta property="og:site_name" content={shop.nameJa} />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} is:inline></script>
  </head>
  <body>
    <Header />
    <main class={wide ? 'wide' : ''}>
      <slot />
    </main>
    <Footer />
  </body>
</html>

<style>
  main {
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-lg) var(--space-md) 0;
  }

  main.wide {
    max-width: none;
    padding-inline: 0;
    padding-top: 0;
  }
</style>
```

- [ ] **Step 6: `src/pages/index.astro` を暫定差し替え**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { shop } from '../data/shop';
---

<BaseLayout title={shop.name}>
  <h1>{shop.tagline}</h1>
</BaseLayout>
```

- [ ] **Step 7: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 8: 目視確認**

Run: `npm run dev`
`http://localhost:4321/` を開き、以下を確認する。

- ヘッダー中央にロゴが出て、900px以上ではナビが左・ロゴが中央の1行になる
- 375px幅ではロゴが上、ナビが下の2段になり折り返しが破綻しない
- フッターに2会場の曜日と時刻がJost（数字が等幅）で出る
- 明朝・ゴシック・Jostの3書体が実際に読み込まれている（DevToolsのNetworkでfonts.gstatic.comへのリクエストを確認）

確認後Ctrl+Cで停止。

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "feat: 共通レイアウトとヘッダー・フッターを追加"
```

---

### Task 4: Content Collectionsとサンプルコンテンツ

**Files:**
- Create: `src/content.config.ts`
- Create: `src/assets/images/menu/placeholder.svg`
- Create: `src/content/menu/momo.md`
- Create: `src/content/menu/momo-earlgrey.md`
- Create: `src/content/menu/sakuranbo.md`
- Create: `src/content/news/2026-06-01-open.md`

**Interfaces:**
- Produces: コレクション `menu`（`name`, `price`, `description`, `image`, `season`, `available`, `order`）
- Produces: コレクション `news`（`title`, `date`, `category`, `draft`）。エントリの `id` は日付プレフィックスを除いたslug

- [ ] **Step 1: プレースホルダ画像を作成**

3:4の縦長。かき氷の写真がこの比率で入る。

`src/assets/images/menu/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <rect width="600" height="800" fill="#e4f2f8" />
  <text x="300" y="410" font-family="sans-serif" font-size="30" fill="#1c6b85" text-anchor="middle" letter-spacing="6">写真準備中</text>
</svg>
```

- [ ] **Step 2: `src/content.config.ts` を作成**

`schema` を関数形式にすると `image()` ヘルパーが使える。`news` は `generateId` でファイル名の日付プレフィックスを外し、slugをそのままURLにする。

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
    // 2026-06-01-open.md → id "open"
    generateId: ({ entry }) => entry.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['休業', '新メニュー', '出店情報', 'その他']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { menu, news };
```

- [ ] **Step 3: メニューのサンプルを3件作成**

Instagramで確認できた商品を使う。価格は未確認のため仮。

`src/content/menu/momo.md`:

```markdown
---
name: 桃
price: 1400
description: その日に届いた桃をむいて、果肉と自家製のシロップだけで仕上げます。
image: ../../assets/images/menu/placeholder.svg
season: summer
available: true
order: 10
---

桃の入荷状況によってお休みする日があります。
```

`src/content/menu/momo-earlgrey.md`:

```markdown
---
name: 桃アールグレイ
price: 1500
description: 桃に、香りを立てたアールグレイのクリームを重ねました。
image: ../../assets/images/menu/placeholder.svg
season: summer
available: true
order: 20
---
```

`src/content/menu/sakuranbo.md`:

```markdown
---
name: さくらんぼ
price: 1600
description: 粒のまま煮含めたさくらんぼと、種から取った香りのシロップ。
image: ../../assets/images/menu/placeholder.svg
season: summer
available: true
order: 30
---
```

- [ ] **Step 4: お知らせのサンプルを作成**

`src/content/news/2026-06-01-open.md`:

```markdown
---
title: 間借りでかき氷屋をはじめます
date: 2026-06-01
category: その他
draft: false
---

6月から、名古屋の2か所を間借りしてかき氷をお出しします。

月曜から土曜は夜の赤鰐で、日曜は昼の cafe KAKAOc です。氷がなくなり次第終了しますので、当日の状況はInstagramをご覧ください。
```

- [ ] **Step 5: スキーマが機能していることを確認（意図的に壊す）**

`src/content/menu/momo.md` の `price: 1400` を一時的に `price: "1400円"` に変更する。

Run: `npm run build`
Expected: FAIL。`menu → momo` の `price` が number でない旨のエラーが出る

確認できたら `price: 1400` に戻す。

- [ ] **Step 6: ビルドが通ることを確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: メニューとお知らせのコレクション定義を追加"
```

---

### Task 5: 出店情報と「本日の出店」

このサイトのシグネチャー要素。トップと `/venues` の両方で使う。

**Files:**
- Create: `src/components/VenueCard.astro`
- Create: `src/components/TodayVenue.astro`
- Create: `src/pages/venues.astro`

**Interfaces:**
- Consumes: `shop`, `venues`, `Venue`（Task 2）、`SectionHeading`、`BaseLayout`（Task 3）
- Produces: `VenueCard` — props `{ venue: Venue; showMap?: boolean }`。`showMap` 既定 false
- Produces: `TodayVenue` — props なし。`shop.venues` を読む

- [ ] **Step 1: `src/components/VenueCard.astro` を作成**

枠線なし。会場名と時刻の対比だけで構造を作る。

```astro
---
import type { Venue } from '../data/shop';

type Props = {
  venue: Venue;
  showMap?: boolean;
};

const { venue, showMap = false } = Astro.props;
---

<article id={venue.id} class="venue">
  <p class="u-label">{venue.daysLabel}</p>
  <h3>{venue.name}</h3>
  <p class="time u-num">{venue.open} – {venue.close}</p>
  <p class="address">{venue.address}</p>
  {venue.note && <p class="note">{venue.note}</p>}
  <p class="map-link">
    <a href={venue.mapUrl} target="_blank" rel="noopener noreferrer">地図を開く ↗</a>
  </p>

  {
    showMap && (
      <iframe
        src={venue.mapEmbedUrl}
        title={`${venue.name}の地図`}
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      />
    )
  }
</article>

<style>
  .venue {
    display: grid;
    gap: var(--space-2xs);
  }

  h3 {
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 3.5vw, 1.9rem);
    font-weight: 400;
    letter-spacing: 0.14em;
    margin-top: var(--space-2xs);
  }

  .time {
    font-size: 1.05rem;
    color: var(--ice-deep);
  }

  .address,
  .note {
    font-size: 0.85rem;
    color: var(--sumi-soft);
  }

  .map-link {
    margin-top: var(--space-xs);
  }

  .map-link a {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    color: var(--ice-deep);
    text-decoration: none;
    border-bottom: 1px solid var(--ice);
    padding-bottom: 0.15em;
  }

  iframe {
    width: 100%;
    height: 320px;
    border: 0;
    border-radius: 4px;
    margin-top: var(--space-md);
  }
</style>
```

- [ ] **Step 2: `src/components/TodayVenue.astro` を作成**

JS無効時は両会場が同じ扱いで並ぶ。JSが動くと今日の会場だけが強調される。見出しの文言もJSが差し替える。

```astro
---
import { shop } from '../data/shop';
---

<section class="today" aria-labelledby="today-heading">
  <p class="u-label">Today</p>
  <p class="lead" id="today-heading" data-today-lead>本日の出店場所</p>

  <ul class="list">
    {
      shop.venues.map((venue) => (
        <li class="item" data-venue data-days={venue.days.join(',')} data-name={venue.name}>
          <span class="days u-num">{venue.daysLabel}</span>
          <span class="name">{venue.name}</span>
          <span class="time u-num">{venue.open} – {venue.close}</span>
        </li>
      ))
    }
  </ul>

  <p class="note">
    氷がなくなり次第終了します。当日の状況は
    <a href={shop.sns.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
    でお知らせしています。
  </p>
</section>

<script>
  const lead = document.querySelector<HTMLElement>('[data-today-lead]');
  const items = document.querySelectorAll<HTMLElement>('[data-venue]');

  if (lead && items.length > 0) {
    const today = new Date().getDay();
    let todayName: string | null = null;

    items.forEach((item) => {
      const days = (item.dataset.days ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number);
      const isToday = days.includes(today);
      item.classList.toggle('is-today', isToday);
      if (isToday) {
        todayName = item.dataset.name ?? null;
      }
    });

    lead.textContent = todayName ? `本日は ${todayName} にいます` : '本日の出店はお休みです';
  }
</script>

<style>
  .today {
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-xl) var(--space-md) 0;
  }

  .lead {
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 4vw, 1.9rem);
    letter-spacing: 0.14em;
    margin-top: var(--space-2xs);
  }

  .list {
    display: grid;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .item {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: var(--space-2xs) var(--space-sm);
    align-items: baseline;
    padding: var(--space-sm) 0;
    opacity: 0.45;
    transition: opacity 0.4s ease;
  }

  /* JSが動かない環境では全会場を等しく表示する */
  .list:not(:has(.is-today)) .item {
    opacity: 1;
  }

  .item.is-today {
    opacity: 1;
  }

  .days {
    font-size: 0.8rem;
    letter-spacing: 0.16em;
    color: var(--sumi-soft);
  }

  .name {
    font-family: var(--font-display);
    font-size: 1.15rem;
    letter-spacing: 0.12em;
  }

  .time {
    grid-column: 2;
    font-size: 0.95rem;
    color: var(--ice-deep);
  }

  .item.is-today .name::after {
    content: "";
    display: inline-block;
    width: 0.4em;
    height: 0.4em;
    margin-left: 0.7em;
    border-radius: 50%;
    background-color: var(--ice);
    vertical-align: 0.15em;
  }

  .note {
    margin-top: var(--space-md);
    font-size: 0.8rem;
    color: var(--sumi-soft);
  }

  .note a {
    color: var(--ice-deep);
  }

  @media (min-width: 720px) {
    .item {
      grid-template-columns: 6rem 1fr auto;
    }

    .time {
      grid-column: 3;
    }
  }
</style>
```

- [ ] **Step 3: `src/pages/venues.astro` を作成**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import VenueCard from '../components/VenueCard.astro';
import TodayVenue from '../components/TodayVenue.astro';
import { shop } from '../data/shop';
---

<BaseLayout
  title="出店情報"
  description="曜日ごとの出店場所と営業時間のご案内です。名古屋市内の2か所で間借り営業しています。"
>
  <SectionHeading label="Venues" title="出店情報" />

  <p class="intro">
    決まったお店を持たず、曜日によって場所が変わります。お越しになる前に曜日と時間をご確認ください。
  </p>

  <TodayVenue />

  <div class="venues">
    {shop.venues.map((venue) => <VenueCard venue={venue} showMap />)}
  </div>

  <section class="payments">
    <p class="u-label">Payment</p>
    <p>{shop.payments.join(' / ')}</p>
  </section>
</BaseLayout>

<style>
  .intro {
    max-width: var(--measure);
    color: var(--sumi-soft);
  }

  .venues {
    display: grid;
    gap: var(--space-xl);
    margin-top: var(--space-xl);
  }

  .payments {
    margin-top: var(--space-xl);
  }

  @media (min-width: 900px) {
    .venues {
      grid-template-columns: 1fr 1fr;
      gap: var(--space-lg);
    }
  }
</style>
```

**注意:** `TodayVenue` は自前で `max-width` と `padding` を持つため、`main` の中に置くと二重に効く。`/venues` では見た目の破綻がないか Step 5 で必ず確認し、必要なら `.today { padding-inline: 0; }` を `venues.astro` 側で上書きすること。

- [ ] **Step 4: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 5: 目視確認（シグネチャー要素の検証）**

Run: `npm run dev`
`http://localhost:4321/venues` を開き、以下を順に確認する。

1. 今日の曜日に対応する会場だけが濃く表示され、見出しが「本日は ◯◯ にいます」に変わっている
2. DevToolsのコンソールでエラーが出ていない
3. **JSを無効化して再読み込みし**（DevTools → Settings → Debugger → Disable JavaScript）、見出しが「本日の出店場所」のまま、2会場が**同じ濃さで**表示されること
4. JSを戻し、375px幅で会場名・時刻・地図が破綻しないこと
5. 上記「注意」の通り、`TodayVenue` の左右余白が二重になっていないか

確認後Ctrl+Cで停止。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: 出店情報ページと本日の出店表示を追加"
```

---

### Task 6: メニューページ

**Files:**
- Create: `src/components/MenuCard.astro`
- Create: `src/pages/menu.astro`

**Interfaces:**
- Consumes: コレクション `menu`（Task 4）、`SectionHeading`、`BaseLayout`（Task 3）
- Produces: `MenuCard` — props `{ entry: CollectionEntry<'menu'> }`

- [ ] **Step 1: `src/components/MenuCard.astro` を作成**

3:4の縦長写真の右に、商品名を縦組みで置く。枠線・角丸カードは使わない（写真の角丸のみ）。

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
  <div class="visual">
    <Image src={image} alt={`${name}のかき氷`} width={600} height={800} />
    <h3 class="u-vertical">{name}</h3>
  </div>
  <p class="price u-num">¥{price.toLocaleString('ja-JP')}</p>
  <p class="description">{description}</p>
</article>

<style>
  .visual {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-sm);
    align-items: start;
  }

  .visual :global(img) {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: 2px;
  }

  h3 {
    font-size: clamp(1rem, 2.6vw, 1.2rem);
    font-weight: 400;
    padding-top: var(--space-xs);
  }

  .price {
    margin-top: var(--space-sm);
    font-size: 0.95rem;
    color: var(--ice-deep);
  }

  .description {
    margin-top: var(--space-2xs);
    font-size: 0.85rem;
    line-height: 1.9;
    color: var(--sumi-soft);
  }
</style>
```

- [ ] **Step 2: `src/pages/menu.astro` を作成**

定番・季節限定のどちらも、該当商品がある場合だけ見出しごと表示する。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import MenuCard from '../components/MenuCard.astro';

const all = (await getCollection('menu', ({ data }) => data.available)).sort(
  (a, b) => a.data.order - b.data.order
);

const groups = [
  { key: 'regular', label: 'Standard', title: '定番', entries: all.filter((e) => e.data.season === 'all') },
  { key: 'seasonal', label: 'Seasonal', title: '季節限定', entries: all.filter((e) => e.data.season !== 'all') },
].filter((group) => group.entries.length > 0);
---

<BaseLayout title="メニュー" description="かき氷のメニューと価格のご案内です。">
  <SectionHeading label="Menu" title="メニュー" />

  <p class="intro">
    その日に届いた果実を使うため、内容は日によって変わります。仕入れの都合でお出しできない日があります。
  </p>

  {
    groups.map((group) => (
      <section class="group">
        <p class="u-label">{group.label}</p>
        <h3 class="group-title">{group.title}</h3>
        <div class="grid">
          {group.entries.map((entry) => (
            <MenuCard entry={entry} />
          ))}
        </div>
      </section>
    ))
  }
</BaseLayout>

<style>
  .intro {
    max-width: var(--measure);
    color: var(--sumi-soft);
  }

  .group {
    margin-top: var(--space-xl);
  }

  .group-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 1.2rem;
    letter-spacing: 0.16em;
    margin-top: var(--space-2xs);
    margin-bottom: var(--space-lg);
  }

  .grid {
    display: grid;
    gap: var(--space-lg) var(--space-md);
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
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
`http://localhost:4321/menu` を開き、以下を確認する。

- 「定番」の見出しごと非表示になっている（サンプルは全て季節限定のため）
- 「季節限定」に3件並ぶ
- 商品名が写真の右に**縦組み**で出る
- 価格が `¥1,400` の形でJost（等幅数字）で出る
- 375px幅で縦組みの商品名が写真の外にはみ出さない

確認後Ctrl+Cで停止。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: メニューページを追加"
```

---

### Task 7: お知らせ一覧と詳細

**Files:**
- Create: `src/components/NewsList.astro`
- Create: `src/layouts/NewsLayout.astro`
- Create: `src/pages/news/index.astro`
- Create: `src/pages/news/[slug].astro`

**Interfaces:**
- Consumes: コレクション `news`（Task 4）、`SectionHeading`、`BaseLayout`（Task 3）
- Produces: `NewsList` — props `{ entries: CollectionEntry<'news'>[]; limit?: number }`。トップ（Task 8）が `limit={3}` で再利用する
- 日付表記は `NewsList` と `NewsLayout` の両方で `toLocaleDateString('ja-JP')` を使い「2026年6月1日」に揃える

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
            <time class="u-num" datetime={entry.data.date.toISOString()}>
              {formatDate(entry.data.date)}
            </time>
            <span class="category">{entry.data.category}</span>
            <span class="title">{entry.data.title}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

<style>
  .list a {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2xs) var(--space-sm);
    padding: var(--space-md) 0;
    text-decoration: none;
    transition: opacity 0.3s ease;
  }

  .list a:hover {
    opacity: 0.6;
  }

  time {
    font-size: 0.8rem;
    color: var(--sumi-soft);
  }

  .category {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    color: var(--ice-deep);
    justify-self: start;
  }

  .title {
    grid-column: 1 / -1;
    font-family: var(--font-display);
    font-size: 1.05rem;
    letter-spacing: 0.1em;
  }

  .empty {
    color: var(--sumi-soft);
  }

  @media (min-width: 720px) {
    .list a {
      grid-template-columns: 8rem 5rem 1fr;
      align-items: baseline;
    }

    .title {
      grid-column: 3;
    }
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
    <p class="meta">
      <time class="u-num" datetime={date.toISOString()}>{formatDate(date)}</time>
      <span class="category">{category}</span>
    </p>
    <h1>{title}</h1>
    <div class="body">
      <slot />
    </div>
    <p class="back"><a href="/news">お知らせ一覧へ</a></p>
  </article>
</BaseLayout>

<style>
  article {
    max-width: var(--measure);
  }

  .meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    font-size: 0.8rem;
    color: var(--sumi-soft);
  }

  .category {
    letter-spacing: 0.14em;
    color: var(--ice-deep);
  }

  h1 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.4rem, 4vw, 1.9rem);
    letter-spacing: 0.12em;
    margin-top: var(--space-xs);
  }

  .body {
    margin-top: var(--space-lg);
  }

  .body :global(p + p) {
    margin-top: var(--space-sm);
  }

  .back {
    margin-top: var(--space-xl);
  }

  .back a {
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    color: var(--ice-deep);
    text-decoration: none;
    border-bottom: 1px solid var(--ice);
    padding-bottom: 0.15em;
  }
</style>
```

- [ ] **Step 3: `src/pages/news/index.astro` を作成**

下書きは本番ビルドでのみ除外し、開発中は確認できるようにする。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import NewsList from '../../components/NewsList.astro';

const entries = (
  await getCollection('news', ({ data }) => (import.meta.env.PROD ? !data.draft : true))
).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="お知らせ" description="出店情報の変更や新メニューのお知らせです。">
  <SectionHeading label="News" title="お知らせ" />
  <NewsList entries={entries} />
</BaseLayout>
```

- [ ] **Step 4: `src/pages/news/[slug].astro` を作成**

Astro 5以降、本文描画は `entry.render()` ではなく `astro:content` の `render(entry)` を使う。

```astro
---
import { getCollection, render } from 'astro:content';
import type { GetStaticPaths } from 'astro';
import NewsLayout from '../../layouts/NewsLayout.astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('news', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
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
Expected: 成功し、`dist/news/index.html` と `dist/news/open/index.html` が生成される（URLから日付プレフィックスが消えていること）

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 6: 目視確認**

Run: `npm run dev`
`http://localhost:4321/news` で一覧が出ること、タイトルから `/news/open` に遷移して本文が読めること、「お知らせ一覧へ」が機能することを確認。確認後Ctrl+Cで停止。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: お知らせの一覧と詳細ページを追加"
```

---

### Task 8: トップページとヒーロー

**Files:**
- Create: `src/assets/images/shop/hero-placeholder.svg`
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`（Task 3の暫定内容を全面差し替え）

**Interfaces:**
- Consumes: `Hero`、`TodayVenue`（Task 5）、`MenuCard`（Task 6）、`NewsList`（Task 7）、`SectionHeading`（Task 3）
- Produces: `Hero` — props なし。`shop` からタグラインを読む

- [ ] **Step 1: ヒーロー用プレースホルダ画像を作成**

かき氷は縦に高いので 3:4 の縦長にする。

`src/assets/images/shop/hero-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
  <rect width="900" height="1200" fill="#eef7fb" />
  <text x="450" y="610" font-family="sans-serif" font-size="42" fill="#1c6b85" text-anchor="middle" letter-spacing="8">メイン写真準備中</text>
</svg>
```

- [ ] **Step 2: `src/components/Hero.astro` を作成**

全幅のグラデーションの上に縦長写真を中央配置し、左右に縦組みのコピーを重ねる。読み込み時に両方のコピーが下から立ち上がる。

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/images/shop/hero-placeholder.svg';
---

<section class="hero">
  <p class="copy copy-left u-vertical">削りたてを、ひと山。</p>

  <div class="visual">
    <Image src={heroImage} alt="" width={900} height={1200} loading="eager" />
  </div>

  <p class="copy copy-right u-vertical">白の上に、季節を。</p>
</section>

<style>
  .hero {
    position: relative;
    display: grid;
    place-items: center;
    min-height: min(78vh, 720px);
    padding: var(--space-lg) var(--space-sm);
    overflow: hidden;
    background:
      radial-gradient(90% 70% at 78% 16%, rgba(90, 189, 221, 0.3), transparent 62%),
      radial-gradient(80% 62% at 16% 74%, rgba(200, 236, 226, 0.5), transparent 64%),
      linear-gradient(180deg, #ffffff 0%, var(--mist) 100%);
  }

  .visual {
    width: min(46vw, 300px);
  }

  .visual :global(img) {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: 2px;
  }

  .copy {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: var(--sumi);
    font-size: clamp(0.95rem, 3.2vw, 1.35rem);
    opacity: 0;
    animation: rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .copy-left {
    left: max(var(--space-sm), 6vw);
    animation-delay: 0.15s;
  }

  .copy-right {
    right: max(var(--space-sm), 6vw);
    animation-delay: 0.35s;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(calc(-50% + 1.5rem));
    }
    to {
      opacity: 1;
      transform: translateY(-50%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .copy {
      opacity: 1;
      animation: none;
    }
  }
</style>
```

**注意:** `.copy` の `transform` はアニメーションと縦位置揃えの両方を担っている。`@keyframes` の `to` を消すと中央揃えが壊れる。

- [ ] **Step 3: `src/pages/index.astro` を全面差し替え**

`wide` を渡してヒーローを全幅にする。以降のセクションは自前で最大幅を持つ。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import TodayVenue from '../components/TodayVenue.astro';
import SectionHeading from '../components/SectionHeading.astro';
import MenuCard from '../components/MenuCard.astro';
import NewsList from '../components/NewsList.astro';
import { shop } from '../data/shop';

const featuredMenu = (await getCollection('menu', ({ data }) => data.available))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 3);

const news = (
  await getCollection('news', ({ data }) => (import.meta.env.PROD ? !data.draft : true))
).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title={shop.name} wide>
  <Hero />

  <TodayVenue />

  <section class="section">
    <SectionHeading label="Menu" title="今おすすめの一杯" />
    <div class="grid">
      {featuredMenu.map((entry) => <MenuCard entry={entry} />)}
    </div>
    <p class="more"><a href="/menu">メニューをすべて見る</a></p>
  </section>

  <section class="section">
    <SectionHeading label="News" title="お知らせ" />
    <NewsList entries={news} limit={3} />
    <p class="more"><a href="/news">お知らせをすべて見る</a></p>
  </section>
</BaseLayout>

<style>
  .section {
    max-width: var(--max-width);
    margin-inline: auto;
    padding: var(--space-2xl) var(--space-md) 0;
  }

  .grid {
    display: grid;
    gap: var(--space-lg) var(--space-md);
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  }

  .more {
    margin-top: var(--space-lg);
    text-align: right;
  }

  .more a {
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    color: var(--ice-deep);
    text-decoration: none;
    border-bottom: 1px solid var(--ice);
    padding-bottom: 0.15em;
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
`http://localhost:4321/` を開き、以下を確認する。

- ヒーローが画面幅いっぱいに広がり、左右のコピーが**縦組み**で写真を挟んでいる
- 読み込み時に左→右の順でコピーが下から立ち上がる
- ヒーロー直下に「本日は ◯◯ にいます」が出る
- おすすめ3件とお知らせが並ぶ
- 375px幅で縦組みのコピーが写真に重ならず、はみ出さない
- OSの「視差効果を減らす」を有効にするとアニメーションが起きない

確認後Ctrl+Cで停止。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: トップページとヒーローを追加"
```

---

### Task 9: お問い合わせ、404、静的アセット、仕上げ

**Files:**
- Create: `src/pages/contact.astro`
- Create: `src/pages/404.astro`
- Create: `public/favicon.svg`
- Create: `public/ogp.svg`
- Create: `public/robots.txt`
- Create: `README.md`

- [ ] **Step 1: `src/pages/contact.astro` を作成**

設計書の通りフォームのバックエンドは作らない。SNSが主導線。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import SnsLinks from '../components/SnsLinks.astro';
import { shop } from '../data/shop';

const mailSubject = encodeURIComponent('お問い合わせ');
---

<BaseLayout title="お問い合わせ" description="ご質問、イベント出店のご依頼はこちらから。">
  <SectionHeading label="Contact" title="お問い合わせ" />

  <p class="intro">
    メニューのご質問、イベントへの出店のご依頼をお受けしています。営業中は返信までお時間をいただきます。
  </p>

  <div class="channels">
    <section>
      <p class="u-label">Instagram</p>
      <p class="body">DMがいちばん早くお返事できます。</p>
      <SnsLinks />
    </section>

    <section>
      <p class="u-label">Mail</p>
      <p class="body">
        <a href={`mailto:${shop.email}?subject=${mailSubject}`}>{shop.email}</a>
      </p>
    </section>
  </div>

  <section class="event">
    <p class="u-label">Event</p>
    <h3>出店のご依頼</h3>
    <p class="body">
      日時、場所、想定人数、電源と給水の有無をあわせてお知らせいただけると、お返事がスムーズです。
    </p>
  </section>
</BaseLayout>

<style>
  .intro {
    max-width: var(--measure);
    color: var(--sumi-soft);
  }

  .channels {
    display: grid;
    gap: var(--space-lg);
    margin-top: var(--space-xl);
  }

  .body {
    margin-top: var(--space-2xs);
    font-size: 0.9rem;
  }

  .body a {
    color: var(--ice-deep);
  }

  .event {
    margin-top: var(--space-xl);
    max-width: var(--measure);
  }

  .event h3 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 1.2rem;
    letter-spacing: 0.14em;
    margin-top: var(--space-2xs);
  }

  @media (min-width: 720px) {
    .channels {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
```

- [ ] **Step 2: `src/pages/404.astro` を作成**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="ページが見つかりません">
  <p class="u-label">404</p>
  <h1>ページが見つかりません</h1>
  <p class="body">お探しのページは移動または削除された可能性があります。</p>
  <p class="back"><a href="/">トップへ</a></p>
</BaseLayout>

<style>
  h1 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.3rem, 4vw, 1.7rem);
    letter-spacing: 0.14em;
    margin-top: var(--space-2xs);
  }

  .body {
    margin-top: var(--space-sm);
    color: var(--sumi-soft);
  }

  .back {
    margin-top: var(--space-lg);
  }

  .back a {
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    color: var(--ice-deep);
    text-decoration: none;
    border-bottom: 1px solid var(--ice);
    padding-bottom: 0.15em;
  }
</style>
```

- [ ] **Step 3: `public/favicon.svg` を作成**

ロゴの雲の輪郭を単純化したもの。ブランドカラー `#5abddd` を使う。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#5abddd" />
  <path d="M10.5 15.5a3.2 3.2 0 0 1 .6-6.2 4.3 4.3 0 0 1 8.2-1 3.4 3.4 0 0 1 2.2 7.2z" fill="#ffffff" />
  <path d="M11 17h10l-4.2 8.5h-1.6z" fill="#ffffff" />
</svg>
```

- [ ] **Step 4: `public/ogp.svg` を作成**

**JPEGはテキストで生成できない**ため、現時点ではSVGの仮画像を置く。差し替えTODOはREADMEに記載する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#5abddd" />
  <text x="600" y="300" font-family="sans-serif" font-size="76" fill="#ffffff" text-anchor="middle" letter-spacing="10">White Project</text>
  <text x="600" y="380" font-family="sans-serif" font-size="30" fill="#e4f2f8" text-anchor="middle" letter-spacing="14">かき氷専門店</text>
</svg>
```

- [ ] **Step 5: `public/robots.txt` を作成**

```
User-agent: *
Allow: /
```

- [ ] **Step 6: `README.md` を作成**

````markdown
# White Project HP

かき氷専門店 White Project の紹介サイト。Astroの静的サイト。

## 開発

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に出力
npm run check    # 型チェック
```

## デザインのルール

崩さないための約束。詳細は `docs/superpowers/specs/2026-07-28-kakigori-site-design.md` を読むこと。

- 色は `src/styles/global.css` の6変数のみ。**彩度のある色はかき氷の写真からしか出さない**
- `--ice`（#5abddd）は装飾専用。文字色には `--ice-deep` を使う（コントラスト比の都合）
- 枠線付きの角丸カードを作らない。区切りは余白で行う
- 縦組みはヒーローのコピーとメニューの商品名だけ
- 数字・時刻・価格は `.u-num`（Jost）で組む

## 出店場所・営業時間を変える

`src/data/shop.ts` の `venues` だけを編集する。トップ、出店情報、フッター、構造化データがすべてここを参照している。

`days` は `0=日曜, 1=月曜 … 6=土曜`。トップの「本日は◯◯にいます」もこの配列で判定している。

## メニューを追加する

1. `src/assets/images/menu/` に写真を置く（**縦長で撮る**。3:4にトリミングされる。スマホ撮影のままでよく、ビルド時に自動圧縮される）
2. `src/content/menu/` に `<商品名のローマ字>.md` を作る

```markdown
---
name: いちご
price: 1400
description: 説明文
image: ../../assets/images/menu/ichigo.jpg
season: winter   # all | spring | summer | autumn | winter
available: true
order: 40        # 小さいほど上に出る
---

本文（任意）
```

3. `npm run build` が通れば反映OK。書き忘れや型違いはここで落ちる

**一時的に出せないとき:** ファイルを消さず `available: false` にする。

## お知らせを投稿する

`src/content/news/` に `YYYY-MM-DD-<slug>.md` を作る。URLは日付を除いた `/news/<slug>`。

```markdown
---
title: 臨時休業のお知らせ
date: 2026-08-12
category: 休業   # 休業 | 新メニュー | 出店情報 | その他
draft: false     # true で本番ビルドから除外
---

本文
```

## 公開前にやること

- [ ] `src/data/shop.ts` の各会場の**正確な住所**を店主に確認して差し替える（現在「住所確認中」）
- [ ] メニューの**価格**を確認して差し替える（現在は仮の値）
- [ ] 問い合わせ用の**メールアドレス**を確認して差し替える
- [ ] `astro.config.mjs` の `site` を実ドメインに差し替える（現在 `https://example.com`）
- [ ] `public/ogp.svg` を 1200x630 のJPEGに差し替える（SVGをOGPサムネイルとして表示しないSNSがある）
- [ ] `src/assets/images/` のプレースホルダSVGを実写に差し替える
````

- [ ] **Step 7: ビルドと型チェック**

Run: `npm run build`
Expected: 成功

Run: `npx astro check`
Expected: `0 errors`

- [ ] **Step 8: 全ページの最終確認**

Run: `npm run preview`
以下を順に開き、ヘッダー・フッターが全ページに出ること、ナビの現在地表示が正しいこと、404が出ることを確認する。

- `http://localhost:4321/`
- `http://localhost:4321/menu`
- `http://localhost:4321/venues`
- `http://localhost:4321/news`
- `http://localhost:4321/news/open`
- `http://localhost:4321/contact`
- `http://localhost:4321/存在しないページ`

- [ ] **Step 9: 単一情報源が機能しているか確認**

`src/data/shop.ts` の `akawani` の `close` を一時的に `'20:30'` に変更する。

Run: `npm run build`
`dist/index.html`（本日の出店）、`dist/venues/index.html`、`dist/menu/index.html`（フッター）の3ファイルすべてで `20:30` になっていることを確認する。

確認後 `'21:30'` に戻し、`npm run build` を再実行する。

- [ ] **Step 10: コミット**

```bash
git add -A
git commit -m "feat: お問い合わせと404、静的アセット、READMEを追加"
```

---

## Self-Review 結果

**仕様カバレッジ:** 設計書の各節を確認した。ページ構成7URL（Task 5〜9）、デザイン方針のカラー6値とタイポグラフィ3書体（Task 1）、縦組み2箇所限定（Task 8ヒーロー / Task 6メニュー）、枠線禁止（全タスクのCSSで角丸カードを使わない構成にした）、シグネチャー要素「本日の出店」とJS無効フォールバック（Task 5、検証はTask 5 Step 5）、モーションとreduced-motion（Task 1とTask 8）、会場配列のデータ設計（Task 2）、メニュー・お知らせのスキーマ（Task 4）、単一情報源の検証（Task 9 Step 9）。成功基準7項目はTask 5 Step 5、Task 8 Step 5、Task 9 Step 8・9で検証される。

**型の一貫性:** `Venue` 型は Task 2 で定義し、Task 5 の `VenueCard` が `import type { Venue }` で受ける。`days` の曜日番号の意味（0=日曜）は Task 2 のコメント、Task 5 のスクリプト、READMEの3箇所で一致させた。`shop.venues` の参照名は全タスクで統一。

**既知の仕様からの逸脱:** 設計書はOGP画像を `ogp.jpg` としているが、実写素材がないため Task 9 で `ogp.svg` の仮画像とし、差し替えTODOをREADMEに残す。

**プレースホルダの扱い:** 住所・価格・メールアドレスは店主未確認のため実装上のプレースホルダとして残す。これは計画の欠落ではなく、READMEの「公開前にやること」で追跡する。
