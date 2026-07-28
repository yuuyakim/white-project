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

## デプロイ

Cloudflare Pages のGitHub連携で公開している。`main` にpushすると自動でビルドされて反映される。手元からのデプロイ操作は不要。

Cloudflare側の設定:

| 項目 | 値 |
|---|---|
| リポジトリ | `yuuyakim/white-project` |
| 本番ブランチ | `main` |
| ビルドコマンド | `npm run build` |
| 出力ディレクトリ | `dist` |

**`.node-version` を消さないこと。** Astro 7 は Node 22.12 以上を要求するが、Cloudflare Pages の既定はそれより古い。このファイルが無いとビルドが落ちる。

作業は `feature/*` ブランチで行い、`main` へのマージで公開される。`main` に直接コミットすると即座に本番へ出る。

## 公開前にやること

- [ ] `src/data/shop.ts` の各会場の**正確な住所**を店主に確認して差し替える（現在「住所確認中」）
- [ ] `src/data/shop.ts` の**支払い方法**を店主に確認して差し替える（現在「確認中」表示）
- [ ] メニューの**価格**を確認して差し替える（現在は仮の値）
- [ ] 問い合わせ用の**メールアドレス**を確認して差し替える
- [ ] `public/ogp.svg` を 1200x630 のJPEGに差し替える（SVGをOGPサムネイルとして表示しないSNSがある）
- [ ] `src/assets/images/` のプレースホルダSVGを実写に差し替える。差し替えたら `Hero.astro` の `alt=""` にも実際の写真を説明するalt textを入れる
- [ ] 独自ドメインを取得したら `astro.config.mjs` の `site` を差し替える（現在は `https://white-project.pages.dev`）
