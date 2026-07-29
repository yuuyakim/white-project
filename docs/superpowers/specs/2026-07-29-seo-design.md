# White Project HP SEO対策 設計書

作成日: 2026-07-29

## 目的

公開済みの White Project 紹介サイト（https://white-project.yuuyakim.com）に SEO 対策を施す。狙いは3つ。

1. **ローカル検索で拾われる** — 「名古屋 かき氷」等で検索結果に出る
2. **SNSシェアの見栄えを直す** — Instagram・X・LINE でURLを貼ったときにカード画像が出る
3. **検索エンジンに正しく拾わせる** — サイトマップ・robots・Search Console でインデックスの土台を作る

表示速度・Core Web Vitals は**今回のスコープ外**とする（Google フォントのレンダーブロッキング等は残る）。

## 現状

サイト制作時（2026-07-28）に基礎的なメタタグは入っている。

| 項目 | 現状 |
|---|---|
| canonical | ✅ `BaseLayout.astro` で全ページ出力 |
| description | ✅ ページごとに指定済み |
| OGPタグ | ⚠️ タグはあるが画像が SVG で機能していない |
| 構造化データ | ⚠️ トップのみ `IceCreamShop` の最小構成 |
| robots.txt | ⚠️ `Allow: /` のみ。`Sitemap:` 行なし |
| sitemap.xml | ❌ 存在しない |
| 404 の noindex | ✅ 対応済み |

### 埋めるべき穴

- **`sitemap.xml` が存在しない。** `@astrojs/sitemap` 未導入。robots.txt にも参照がない
- **OGP画像が `/ogp.svg`。** X・Facebook・LINE はいずれも OGP に SVG を描画しない。現状シェア画像は出ていない
- **トップの `<title>` に地域キーワードがない。** 「かき氷専門店 White Project」のみで「名古屋」が入らない
- **構造化データが最小構成。** `address` / `openingHoursSpecification` / `image` / `priceRange` なし
- **お知らせ記事に記事用の構造化データがない。** description も「◯月◯日のお知らせ」と機械的
- **パンくずの構造化データがない**

## 設計

### 1. インデックスの土台

`@astrojs/sitemap`（3.7.3）を導入し `/sitemap-index.xml` を生成する。`astro.config.mjs` にはすでに `site` が設定済みなので追加設定は不要。`public/robots.txt` に `Sitemap:` 行を追加する。

404 は `noindex` 済みで、Astro のサイトマップは 404 を含めないため追加対応は不要。

**Search Console の所有権確認は DNS TXT レコード方式を推奨する。** Cloudflare でドメインを管理しているため設定でき、HTMLタグ方式と違ってデプロイに依存せず、レイアウト変更で消える事故もない。ただし店主側でDNSを触れない可能性を考え、`shop.ts` に `googleSiteVerification` フィールドを用意し、値が入っていれば `BaseLayout` が meta タグを出す形にしておく（既定は空文字＝出力しない）。

### 2. SNSシェア（OGP）

#### OGP画像を PNG にする

既存の `public/ogp.svg` は `<rect>` と `<text>` だけの単純なSVGだが、**これを変換するアプローチは採らない。** `<text>` に「かき氷専門店」という日本語が含まれ、変換ツールが日本語フォントを解決できず豆腐（□□□）になるリスクがあるため。

代わりに既存のブランド素材 `src/assets/images/brand/logo-on-blue.png`（870×1022）を使い、**テキスト描画を一切発生させずに**合成する。

- キャンバス 1200×630
- 背景色は `logo-on-blue.png` の角のピクセルからサンプリングした値を使う（ブランド定義値 `#5ABDDD` を直接使うと、ロゴ画像側の青とわずかにズレて継ぎ目が見える可能性があるため）
- ロゴを高さ 630 に収まるよう contain でリサイズし、中央に合成

`sharp` を devDependency に追加し、`scripts/build-ogp.mjs` として実装、`npm run ogp` で実行する。**生成物 `public/ogp.png` はリポジトリにコミットする。** ビルドのたびに走らせない（ブランド素材が変わらない限り再生成不要で、ビルド時間と `sharp` のプラットフォーム依存をCIに持ち込みたくないため）。

`public/ogp.svg` は削除する。参照元がなくなるため。

#### メタタグの補強

`BaseLayout.astro` に追加する。

- `og:image` を `/ogp.png` に変更
- `og:image:width` = 1200、`og:image:height` = 630
- `og:image:alt`
- `og:locale` = `ja_JP`
- `twitter:image`（`og:image` から継承されるが、クローラの実装差を踏まえ明示する）
- お知らせ記事は `og:type` を `article` にする（現状は全ページ `website` 固定）

`og:type` をページごとに変えるため、`BaseLayout` の Props に `ogType?: 'website' | 'article'`（既定 `'website'`）を追加する。

### 3. ローカル検索（構造化データ + コピー）

#### 構造化データの生成をライブラリに切り出す

現状 `BaseLayout.astro` のフロントマターに JSON-LD がベタ書きされている。記事用・パンくず用を足すと肥大するため、**`src/lib/structuredData.ts` に切り出す。**

あわせて `BaseLayout` の Props を変更する。

```
- structuredData?: boolean   // 真偽値では1種類しか出し分けられない
+ jsonLd?: object[]          // 複数のスキーマを並べられる
```

`<head>` では配列を map して `<script type="application/ld+json">` を出力する。

#### 間借り営業の表現

**`IceCreamShop` に `address` を直接持たせない。** 赤鰐・cafe KAKAOc の住所は他店の住所であり、これを自店の `address` として申告すると、後日 Google ビジネスプロフィールを申請した際の整合性リスクになる。

代わりに各会場を `Place` として表現し、`IceCreamShop` の `location` に配列で持たせる。実店舗を持たず複数会場に出店する事業者の正しい表現であり、住所情報の SEO 上の価値は保ちつつリスクを避けられる。

生成する3種類:

| スキーマ | 出力先 | 内容 |
|---|---|---|
| `IceCreamShop` | `/`、`/venues` | `name` / `description` / `url` / `image`（OGP画像の絶対URL）/ `priceRange` / `servesCuisine` / `sameAs`（SNS）/ `areaServed` / `location`（各会場の `Place`。`address` は `PostalAddress`、`openingHoursSpecification` を会場ごとに持つ） |
| `BlogPosting` | `/news/[slug]` | `headline` / `datePublished` / `dateModified` / `author`（Organization）/ `publisher` / `mainEntityOfPage` / `articleSection`（category） |
| `BreadcrumbList` | 全下層ページ | トップ → （中間）→ 現在地 |

`shop.ts` の `Venue` 型に構造化データ用のフィールドを追加する。

```
+ postalCode?: string      // 例: "460-0011"
+ addressLocality: string  // 例: "名古屋市中区"
+ streetAddress?: string   // 例: "大須3-1-1"
```

現状の `address: string`（表示用の一文）は画面表示にそのまま使うため残す。構造化データ用は別フィールドとし、**値が揃っていない会場は構造化データから住所を省く**（不完全な住所や「（住所確認中）」を出力しない）。実データは実装時に店主確認分を反映する。

あわせて `shop.ts` に `priceRange`（例: `'¥1,000〜¥1,800'`）を追加する。

#### コピーの地域キーワード

現状トップの `<title>` は「かき氷専門店 White Project」で、**地域名が一切入っていない。** ここが最大の機会損失。

| 対象 | 現状 | 変更後 |
|---|---|---|
| トップ `<title>` | かき氷専門店 White Project | かき氷専門店 White Project \| 名古屋の間借りかき氷 |
| トップ h1（visually-hidden） | かき氷専門店 White Project | 名古屋のかき氷専門店 White Project |
| `/venues` description | 曜日ごとの出店場所と営業時間のご案内です。名古屋市内の2か所で間借り営業しています。 | 現状維持（すでに地域名あり） |
| `/menu` description | かき氷のメニューと価格のご案内です。 | 名古屋のかき氷専門店 White Project のメニューと価格。季節の果実を使った一杯をご紹介します。 |
| `/contact` description | ご質問、イベント出店のご依頼はこちらから。 | 名古屋のかき氷専門店 White Project へのお問い合わせ・イベント出店のご依頼はこちらから。 |
| 記事 description | `${formatDate(date)}のお知らせ` | 本文冒頭から抜粋（最大120字、句読点で切る）。抜粋できない場合は現状の文言にフォールバック |

区切り文字は既存の `pageTitle` 組み立てロジックに合わせ、半角スペース + `|` + 半角スペースで統一する（全角 `｜` は使わない）。

### 4. 運用手順書

`docs/seo-setup.md` を新規作成する。コードでは閉じない作業をまとめる。

- Search Console の登録（DNS TXT 方式の手順、代替の meta タグ方式）
- サイトマップの送信
- リッチリザルトテストでの構造化データ検証手順
- Instagram / Threads プロフィールへのURL掲載
- **Google ビジネスプロフィールについての注意** — 間借り営業は「他事業者の所在地内での営業」にあたり、Google のポリシー上、独自の看板・独自の営業時間・独自スタッフといった条件を満たさないと登録が通らないことがある。確実に通る前提では書けないため、申請条件と却下されうる旨を併記する。ここは店主の判断が必要な領域である

## スコープ外

- 表示速度・Core Web Vitals の改善（Google フォントのレンダーブロッキング、画像フォーマット最適化）
- ページごとに異なる OGP 画像の動的生成（メニュー画像を使ったカード等）。まず共通1枚で足りる
- 多言語対応・hreflang
- ブログ記事の追加やコンテンツ量の増加といった、コード外の施策

## 実装の分割

`main` → `feature/seo` → 作業ブランチ×3 の構成で進める。各作業ブランチは `feature/seo` を base に PR を出す。

| # | ブランチ | 内容 |
|---|---|---|
| 1 | `feat/sitemap-robots` | `@astrojs/sitemap` 導入、robots.txt に `Sitemap:` 行、`googleSiteVerification` の器 |
| 2 | `feat/ogp-image` | `sharp` + `scripts/build-ogp.mjs`、`public/ogp.png` 生成とコミット、`ogp.svg` 削除、メタタグ補強（`og:type` 含む） |
| 3 | `feat/structured-data` | `src/lib/structuredData.ts` 切り出し、`BaseLayout` の Props 変更、3種のスキーマ、`shop.ts` 拡張、コピーの地域キーワード、`docs/seo-setup.md` |

## 検証

- `npm run build` と `npm run check` が通る
- ビルド出力に `sitemap-index.xml` と `sitemap-0.xml` が生成され、404 を除く全ページ（`/`・`/menu`・`/venues`・`/news`・`/news/[slug]`・`/contact`）が含まれる
- `public/ogp.png` が 1200×630 で、目視でロゴが欠けず背景に継ぎ目がない
- 生成された各ページのJSON-LDを Google リッチリザルトテストに通し、エラー0
- 本番デプロイ後、実際にURLをLINEに貼ってカード画像が出ることを確認する

## 未確定事項

実装時に店主確認が必要なもの。揃わない場合は該当フィールドを構造化データから省く（虚偽・不完全な値は出さない）。

- 各会場の正確な住所（郵便番号・市区町村・番地）
- 問い合わせ用メールアドレス（現状 `info@example.com` のまま）
- 価格帯（`priceRange`）
- Search Console / Google ビジネスプロフィールの登録状況
