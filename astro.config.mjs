import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://your-blog-domain.com',
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    tailwind(),
  ],
  output: 'server',
  adapter: vercel({
    imageService: true,
    webAnalytics: { enabled: true },
  }),
  image: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
      },
    ],
  },
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  scopedStyleStrategy: 'where',
  server: {
    port: 4321,
  },
})
