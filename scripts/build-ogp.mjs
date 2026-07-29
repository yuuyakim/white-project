// OGPカード画像を生成するワンショットスクリプト。`npm run ogp` で実行する。
// ブランド素材が変わったときだけ再実行すればよく、ビルドのたびには走らせない。
// 生成物 public/ogp.png はリポジトリにコミットする。
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const LOGO = fileURLToPath(new URL('../src/assets/images/brand/logo-on-blue.png', import.meta.url));
const OUT = fileURLToPath(new URL('../public/ogp.png', import.meta.url));

/** OGPの推奨サイズ。X・Facebook・LINE のいずれもこの比率で切られる。 */
const WIDTH = 1200;
const HEIGHT = 630;
/** ロゴの高さ。上下に余白を残すためキャンバス高より小さくする。 */
const LOGO_HEIGHT = 520;

// 背景色はロゴ画像の角のピクセルから取る。ブランド定義値 #5ABDDD を直接使うと
// ロゴ画像側の青とわずかにズレて、合成の継ぎ目が見えることがあるため。
const { data: corner } = await sharp(LOGO)
  .extract({ left: 0, top: 0, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const [r, g, b] = corner;

const logo = await sharp(LOGO).resize({ height: LOGO_HEIGHT }).toBuffer();

await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r, g, b, alpha: 1 } },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(OUT);

console.log(`public/ogp.png を生成しました: ${WIDTH}x${HEIGHT} / 背景 rgb(${r}, ${g}, ${b})`);
