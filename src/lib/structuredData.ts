import type { Venue } from '../data/shop';
import { shop } from '../data/shop';

/** 曜日番号（0=日曜）を schema.org の DayOfWeek に対応させる。Venue.days と同じ並び。 */
const DAY_OF_WEEK = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
] as const;

/** 未確定のフィールドを構造化データに出さないための除去。値が空・undefined のキーを落とす。 */
const compact = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as T;

/**
 * サイト内パスを絶対URLにする。canonical・サイトマップと同じ「末尾スラッシュあり」の形式に揃える
 * （ルート `/` はそのまま）。`/ogp.png` のような拡張子を持つファイルパスはスラッシュを付けずに返す。
 */
const absoluteUrl = (path: string, site: URL | undefined) => {
  const url = new URL(path, site);
  const isFile = /\.[a-zA-Z0-9]+$/.test(url.pathname);
  if (!isFile && !url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url.href;
};

/**
 * 会場を Place として表す。
 * 間借り先の住所は他店の住所なので、IceCreamShop の address には載せず location に置く。
 * 「（住所確認中）」のような表示用文字列は流し込まず、確定しているフィールドだけを出す。
 * name は間借り先単独の名前ではなく「屋号（会場名店内）」にする。venue.name のみだと
 * openingHoursSpecification が間借り先自身の営業時間だと誤読されるため。
 */
const venuePlace = (venue: Venue) => ({
  '@type': 'Place',
  name: `${shop.name}（${venue.name}店内）`,
  address: compact({
    '@type': 'PostalAddress',
    addressCountry: 'JP',
    addressRegion: '愛知県',
    addressLocality: venue.addressLocality,
    postalCode: venue.postalCode,
    streetAddress: venue.streetAddress,
  }),
  openingHoursSpecification: venue.days.map((day) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DAY_OF_WEEK[day],
    opens: venue.open,
    closes: venue.close,
  })),
});

/** トップと出店情報ページに出す店舗スキーマ。 */
export const shopJsonLd = (site: URL | undefined) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'IceCreamShop',
    name: shop.nameJa,
    alternateName: shop.name,
    description: shop.description,
    url: absoluteUrl('/', site),
    image: absoluteUrl('/ogp.png', site),
    priceRange: shop.priceRange,
    servesCuisine: 'かき氷',
    areaServed: '愛知県名古屋市',
    sameAs: Object.values(shop.sns).filter(Boolean),
    location: shop.venues.map(venuePlace),
  });

export type BreadcrumbItem = {
  name: string;
  /** サイトルートからのパス。例: '/menu' */
  path: string;
};

/** パンくず。呼び出し側はトップを含めた全階層を渡す。 */
export const breadcrumbJsonLd = (items: BreadcrumbItem[], site: URL | undefined) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path, site),
  })),
});

export type ArticleInput = {
  title: string;
  date: Date;
  category: string;
  /** サイトルートからのパス。例: '/news/open' */
  path: string;
  /** description に使う抜粋。作れなかった場合は undefined */
  description?: string;
};

/** お知らせ記事のスキーマ。 */
export const articleJsonLd = (input: ArticleInput, site: URL | undefined) => {
  const url = absoluteUrl(input.path, site);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    datePublished: input.date.toISOString(),
    // 更新日を別途持っていないため公開日と同じ値を入れる
    dateModified: input.date.toISOString(),
    articleSection: input.category,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    image: absoluteUrl('/ogp.png', site),
    author: { '@type': 'Organization', name: shop.nameJa },
    publisher: { '@type': 'Organization', name: shop.nameJa },
  });
};
