import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Cloudflare Pages の既定ドメイン。canonicalとOGPの絶対URL生成に使う。
  // TODO: 独自ドメインを取得したらそちらへ差し替える
  site: 'https://white-project.pages.dev',

  adapter: cloudflare(),
});