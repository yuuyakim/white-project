/**
 * Markdown本文の冒頭から meta description 用の抜粋を作る。
 * 記法を落として一行にし、上限を超えたら句読点で切る。
 * 抜粋が作れない場合は undefined を返し、呼び出し側でフォールバックさせる。
 */
export const excerpt = (body: string | undefined, max = 120): string | undefined => {
  if (!body) return undefined;

  const text = body
    .replace(/^---[\s\S]*?---/, '') // 念のためのフロントマター除去
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 画像は落とす
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // リンクは表示テキストだけ残す
    .replace(/^[#>\s]+/gm, '') // 見出し・引用の行頭記号
    .replace(/[*_`~]/g, '') // 強調・コード
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return undefined;
  if (text.length <= max) return text;

  const head = text.slice(0, max);
  const cut = Math.max(head.lastIndexOf('。'), head.lastIndexOf('、'));
  return cut > 0 ? head.slice(0, cut + 1) : `${head.slice(0, max - 1)}…`;
};
