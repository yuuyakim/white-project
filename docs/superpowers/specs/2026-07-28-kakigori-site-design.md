# かき氷屋HP 設計書

作成日: 2026-07-28

## 目的

友人が営むかき氷屋の店舗紹介サイトを制作する。来店を検討している人が「何が食べられるか」「いつ・どこで開いているか」を最短で確認でき、イベント出店などの相談窓口にもなることをゴールとする。

## 前提

- 技術スタック: Astro（静的サイト生成）
- コンテンツ更新: 制作者本人がMarkdownを編集し、Gitにpushして反映する。店主はCMS管理画面を触らない
- 想定規模: 静的4ページ + お知らせ記事（継続的に増える）

## ページ構成

| URL | 内容 |
|---|---|
| `/` | トップ。ヒーロー画像、看板メニュー数点、直近のお知らせ、営業時間 |
| `/menu` | メニュー一覧。通年商品と季節商品を分けて表示 |
| `/access` | 住所、地図、営業時間、駐車場、支払い方法 |
| `/contact` | お問い合わせ・イベント出店の販売依頼。連絡先とSNSへの導線 |
| `/news` | お知らせ一覧 |
| `/news/[slug]` | お知らせ詳細。Markdownから自動生成 |
| `/404` | 404ページ |

## ディレクトリ構成

```
kakigori-site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md                      # メニュー追加・お知らせ投稿の手順を記載
├── public/
│   ├── favicon.svg
│   ├── ogp.jpg
│   └── robots.txt
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── menu.astro
│   │   ├── access.astro
│   │   ├── contact.astro
│   │   ├── news/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── 404.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── NewsLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── MenuCard.astro
│   │   ├── NewsList.astro
│   │   ├── BusinessHours.astro
│   │   └── SnsLinks.astro
│   ├── content/
│   │   ├── menu/
│   │   └── news/
│   ├── content.config.ts
│   ├── data/
│   │   └── shop.ts
│   ├── assets/
│   │   └── images/
│   │       ├── menu/
│   │       └── shop/
│   └── styles/
│       └── global.css
└── docs/
    └── superpowers/specs/
```

## データ設計

### メニュー（`src/content/menu/`）

1商品1ファイル。季節商品の入れ替えはファイルの追加、または `available` の切り替えだけで完結する。

`content.config.ts` でzodスキーマを定義し、必須項目の書き忘れをビルド時に検出する。

| フィールド | 型 | 説明 |
|---|---|---|
| `name` | string | 商品名 |
| `price` | number | 税込価格（円） |
| `description` | string | 説明文 |
| `image` | image() | `src/assets/images/menu/` 配下の画像 |
| `season` | `'all'` \| `'spring'` \| `'summer'` \| `'autumn'` \| `'winter'` | 提供期間 |
| `available` | boolean | 現在提供中か |
| `order` | number | 表示順 |

### お知らせ（`src/content/news/`）

ファイル名は `YYYY-MM-DD-<slug>.md` とし、slugがそのままURLになる。

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | string | 見出し |
| `date` | date | 公開日。一覧はこれの降順 |
| `category` | `'休業'` \| `'新メニュー'` \| `'イベント'` \| `'その他'` | 分類 |
| `draft` | boolean | trueなら本番ビルドから除外 |

### 店舗情報（`src/data/shop.ts`）

店名・住所・電話番号・営業時間・定休日・SNSアカウント・地図URLを保持する唯一の情報源。トップ、アクセス、フッター、構造化データ（JSON-LD）の4箇所がここを参照する。同じ情報を複数ファイルに書かないことで、営業時間変更時の反映漏れを防ぐ。

## コンポーネント設計

各コンポーネントは props で受け取ったデータを表示するだけに徹し、データ取得（`getCollection`）はページ側で行う。これによりコンポーネント単体の責務が「表示」に限定され、差し替えとテストが容易になる。

- `BaseLayout.astro` — `<head>`、meta、OGP、JSON-LD、Header/Footer を含む全ページ共通の外枠。ページ固有のtitle/descriptionはpropsで受け取る
- `NewsLayout.astro` — お知らせ詳細の本文枠。`BaseLayout` を内包する
- `MenuCard.astro` — メニュー1件分の表示。商品データをpropsで受け取る
- `BusinessHours.astro` — `shop.ts` の営業時間を整形して表示
- `NewsList.astro` — お知らせ配列を受け取って一覧表示。件数上限をpropsで指定できるようにし、トップと `/news` の両方で使う

## 画像の扱い

- `src/assets/images/` — メニュー写真・店舗写真。Astro Imageコンポーネント経由で圧縮・WebP変換・レスポンシブ対応を自動化する。スマホ撮影の写真をそのまま置ける
- `public/` — OGP画像とfaviconのみ。最適化を通さず固定URLで配信する必要があるもの

## エラー処理・ビルド時の検証

- コンテンツのスキーマ違反はzodがビルド時に検出し、ビルドを失敗させる。壊れたページが公開されることを防ぐ
- 存在しないURLは `404.astro` で受ける
- `draft: true` のお知らせは本番ビルドから除外する

## スコープ外

以下は今回作らない。必要になった時点で追加できる構成にしてある。

- 営業カレンダーのUIコンポーネント（お知らせでの告知で代替）
- お問い合わせフォームのバックエンド（メールリンクとSNS導線で代替）
- 多言語対応
- ECサイト機能・予約機能
- 自動テスト（静的な表示のみのため、ビルド成功をもって検証とする）

## 成功基準

- 4ページ + お知らせ一覧/詳細が表示され、ビルドが通る
- 営業時間を `shop.ts` の1箇所で変更すると、サイト内の全表示に反映される
- Markdownファイルを1つ追加するだけで、メニューまたはお知らせが増える
- スマートフォンでの表示が崩れない
