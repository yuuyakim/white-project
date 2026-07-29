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
  /** 構造化データ用の郵便番号。ハイフンあり。未確定なら省く */
  postalCode?: string;
  /** 構造化データ用の市区町村。確定しているので必須。例: "名古屋市中区" */
  addressLocality: string;
  /** 構造化データ用の番地。未確定なら省く */
  streetAddress?: string;
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
    addressLocality: '名古屋市',
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
    addressLocality: '名古屋市',
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
  // TODO: 店主に確認
  payments: ['現金', 'PayPay'],
  // TODO: 店主に確認 — 実際の価格帯
  /** 構造化データの priceRange。schema.org は自由文字列を許す */
  priceRange: '¥1,000〜¥1,800',
  /** トップページのtitleに付ける地域キーワード。下層ページは `${title} | ${shop.name}` のまま */
  homeTitleSuffix: '名古屋の間借りかき氷',
  /**
   * Search Console の所有権確認を meta タグ方式で行う場合のみ、発行された content 値を入れる。
   * DNS TXT レコード方式で確認する場合は空文字のままにする（空ならタグを出力しない）。
   */
  googleSiteVerification: '',
  sns: {
    instagram: 'https://www.instagram.com/whiteproject_kakigori/',
    threads: 'https://www.threads.net/@whiteproject_kakigori',
  },
  venues,
};
