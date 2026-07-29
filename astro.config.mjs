import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 本番の公開URL。canonicalとOGPの絶対URL生成、およびサイトマップのURL生成に使う。
  // workers.dev のサブドメインは無効化してあるため、カスタムドメインが唯一の入口。
  site: 'https://white-project.yuuyakim.com',
  integrations: [sitemap()],
});
