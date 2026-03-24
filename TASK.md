# Build Task: homes119.com

Read PROJECT.md for the full brand spec and 10 article topics.

## Step 1: Astro 5 Setup
- `npm create astro@latest .` (empty template, skip git init since already done)
- Install: `@astrojs/sitemap`, `@astrojs/mdx`
- astro.config.mjs: site = 'https://homes119.com', integrations = [sitemap(), mdx()]
- Content config at `src/content.config.ts` (Astro 5 style)

## Step 2: Design System
Create `src/styles/global.css` with CSS Variables:
- Primary: #2563EB (blue, trust)
- Accent: #F97316 (orange, CTA)
- Background: #FAFBFC
- Text: #1A1A2E
- Card bg: #FFFFFF
- Font: system-ui + Noto Sans TC
- Mobile-first responsive
- Clean, trustworthy feel — like a government info site but friendlier
- Price tables should be prominent and clear

## Step 3: Layouts & Components
- `src/layouts/BaseLayout.astro` — html head + body + nav + footer
- Navigation: 首頁 | 費用行情 | 文章 | 關於我們
- Footer: © 2026 homes119.com — 台灣水管清洗資訊站
- `src/components/ArticleCard.astro` — blog list cards
- `src/components/PriceTable.astro` — reusable price comparison table
- `src/components/CTABanner.astro` — "查你家附近的師傅" call-to-action

## Step 4: Pages
- `src/pages/index.astro` — homepage with hero + latest articles + CTA
- `src/pages/blog/index.astro` — blog list
- `src/pages/blog/[...slug].astro` — blog article page
- `src/pages/about.astro` — about page (中立資訊站，不收業者推薦費)
- `src/pages/rss.xml.js` — RSS feed

## Step 5: Write 10 SEO Articles
Create 10 markdown files in `src/content/posts/`. Each article:
- 2,000-3,000 字 in Traditional Chinese
- Proper frontmatter: title, description, pubDate (2026-03-24), category, tags, author: "homes119"
- H2/H3 structure targeting the keywords
- Featured Snippet paragraph after each H2 (40-60 chars, direct answer)
- FAQ section at the bottom (3-5 Q&A)
- Internal links between articles where relevant
- CTA at the end: "想找你家附近的水管清洗師傅？" + placeholder link

Articles to write (see PROJECT.md for details):
1. 2026 水管清洗費用完整指南（公寓/透天/各地區行情比較）
2. 熱水量變小？先別換熱水器——90% 的原因是水管
3. 台北水管清洗推薦（費用行情＋選師傅重點）
4. 水龍頭流出黃水、有鐵鏽味？你家水管在求救
5. 高週波水管清洗是什麼？原理、流程、效果
6. 透天厝洗水管費用怎麼算
7. 水管漏水免打牆補漏（工法、費用、適用情境）
8. 水管多久要清洗一次
9. 洗水管到底有沒有效？真實案例＋疑問破解
10. 台中水管清洗推薦（費用行情＋業者評比）

IMPORTANT for article content:
- Use REAL price ranges from the market (公寓 $3,000-4,500, 透天 $5,000-8,000, 水刀 $15,000-18,000)
- Don't invent specific company names or fake testimonials
- Write like a knowledgeable neighbor explaining things, not a salesman
- Each article should naturally link to 2-3 other articles from the list

## Step 6: Build & Verify
- Run `npm run build` and fix any errors
- Verify all 10 articles render correctly
- Check sitemap generation

## Step 7: Git
- `git add -A && git commit -m "feat: initial site with 10 articles"`

## Technical Notes (from astro-gotchas):
- CSS: import in frontmatter, NOT <link> tag
- Content config: src/content.config.ts (NOT src/content/config.ts)
- GA4 scripts: use Fragment set:html (add later, not now)
- If RSS fails: npm install fast-xml-builder

DO NOT use Tailwind. Use pure CSS with CSS Variables.
DO NOT create placeholder/empty articles. Write FULL content for all 10.
