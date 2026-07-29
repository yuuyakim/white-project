# SEO 運用手順

コードでは閉じない、公開後にやる作業をまとめる。実装側の設計は
`superpowers/specs/2026-07-29-seo-design.md` を参照。

## 1. Google Search Console に登録する

サイトが検索でどう扱われているかを見る唯一の窓口。**最初にこれをやる。**

### 推奨: DNS TXT レコード方式

Cloudflare でドメインを管理しているため設定でき、デプロイに依存せず、
レイアウト変更で消える事故もない。

1. https://search.google.com/search-console で「ドメイン」プロパティを選ぶ
2. `yuuyakim.com` を入力する
3. 表示された TXT レコードの値をコピーする
4. Cloudflare ダッシュボード → 該当ドメイン → DNS → レコードを追加
   - タイプ: `TXT` / 名前: `@` / コンテンツ: コピーした値
5. Search Console に戻って「確認」を押す（反映まで数分〜数時間かかることがある）

### 代替: meta タグ方式

DNS を触れない場合に使う。

1. Search Console で「URL プレフィックス」プロパティを選び
   `https://white-project.yuuyakim.com` を入力する
2. 「HTML タグ」の `content="..."` の値をコピーする
3. `src/data/shop.ts` の `googleSiteVerification` にその値を入れる
4. デプロイしてから Search Console で「確認」を押す

## 2. サイトマップを送信する

所有権確認が済んだら、Search Console の「サイトマップ」から以下を送信する。

```
https://white-project.yuuyakim.com/sitemap-index.xml
```

「成功しました」と表示され、検出URL数が 6 になれば正しい。

## 3. 構造化データを検証する

デプロイ後、以下の各URLを https://search.google.com/test/rich-results に通す。
**`IceCreamShop` の `address` 欠落エラー（下記参照）以外はエラー0 を確認する。**
警告（推奨プロパティの欠落）は、値が未確定なものであれば許容してよい。

| URL | 出るべきスキーマ |
|---|---|
| `/` | IceCreamShop |
| `/venues` | IceCreamShop, BreadcrumbList |
| `/menu` | BreadcrumbList |
| `/news/open` | BlogPosting, BreadcrumbList |

**`IceCreamShop`（`/` と `/venues`）で `address` の欠落エラーが出るのは想定内。**
White Projectは固定の店舗を持たない間借り営業のため、`address` はあえて
トップレベルに置かず、会場ごとの情報を `location` 配下の `Place` に載せる設計にしている
（詳細は spec の間借りモデリングの節を参照）。Google側は `LocalBusiness` 系スキーマで
`address` を必須プロパティとして扱うため、Rich Results Testはこの欠落を
エラーとして報告してくると見込んでいる（実機では未確認）。**これは不具合ではなく
設計通りの結果として確認してほしい。** `address` 以外の項目でエラーが出た場合や、
`location` 配下の `Place`自体にエラーが出る場合は要調査。

## 4. SNSシェアのカード表示を確認する

**実際に貼って確認する。** キャッシュが効くため、修正後は各デバッガで再取得する。

- LINE: トークで自分宛にURLを送る
- X: 投稿の下書き画面（ポスト作成画面）にURLを貼り付け、プレビューでカードが出るか確認する
  （旧Card Validator `cards-dev.twitter.com/validator` は廃止されログイン画面にリダイレクトされる）
- Facebook: https://developers.facebook.com/tools/debug/

画像が出ない場合、まず `https://white-project.yuuyakim.com/ogp.png` が
直接開けるかを確認する。

## 5. SNSプロフィールにURLを載せる

Instagram（@whiteproject_kakigori）と Threads のプロフィール欄に
サイトURLを入れる。被リンクとしての価値は小さいが、**現状の流入は
ほぼSNS経由**であり、実利用の導線としてここが一番効く。

## 6. Google ビジネスプロフィール（要判断）

マップに店舗として出るための登録。ローカル検索では最も効果が大きい。

**ただし間借り営業では登録が通らない可能性がある。** Google のポリシー上、
他事業者の所在地内で営業する店舗（いわゆる店舗内店舗）は、独自の看板・
独自の営業時間・独自スタッフといった条件を満たす場合に限り登録できる。
White Project は独自の営業時間を持つが、看板や常設の設備の状況によっては
却下されうる。

**また、間借り先（赤鰐 / cafe KAKAOc）の住所で登録することになるため、
事前に間借り先の了承が要る。** 店主の判断が必要な領域なので、こちらの
判断で申請を進めないこと。

申請する場合の注意:

- 住所は実際に営業している会場のもので、かつ了承を得たものだけを使う
- 営業時間は間借り先の営業時間ではなく **White Project の出店時間**を入れる
- サイトの構造化データと登録情報（屋号・営業時間）を食い違わせない

## 7. 効果を見る

Search Console の「検索パフォーマンス」で、以下を月1回ほど見る。

- 「名古屋 かき氷」など地域キーワードでの表示回数
- クリック率が極端に低いページ（title / description の見直し対象）

インデックス登録には数日〜数週間かかる。**登録直後に結果が出なくても
異常ではない。**
