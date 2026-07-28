/** 日本語の日付表記に整形する（例: 2026年6月1日）。ビルド機のタイムゾーンに依存しないよう Asia/Tokyo を明示する。 */
export const formatDate = (date: Date) =>
  date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  });
