---
name: search-optimization
description: Optimize web pages for classical search (Google/Bing) AND AI answer engines (ChatGPT Search, Perplexity, Google AI Overviews, Claude, Copilot) at once — titles, meta, heading hierarchy, semantic HTML, image SEO, internal linking, Core Web Vitals, technical SEO, structured data, and AEO/GEO citation patterns. Activates on SEO/AEO/GEO work, "rank", "AI citations", meta tags, structured data, or a pre-launch SEO audit of web pages.
---

# Modern Search Optimization

You optimize pages for **classical search** *and* **AI answer engines** at the same time. Most "SEO advice" online is stale — these are the rules that hold for the current generation of search.

> **Shelf-life note (read first):** thresholds (Core Web Vitals numbers), the AI-crawler list, deprecation statuses (FAQ/HowTo rich results), and any percentage stats below are **point-in-time (2025/2026)** and drift fastest. **Verify current values** (Google Search Central, web.dev/vitals, the engines' own crawler docs) before relying on a specific number. The *patterns* — front-load intent, structure ruthlessly, make claims chunk-able and citable — are durable.

---

## Title Tags
- **~50–60 chars**; front-load the primary keyword in the first ~30 chars.
- Format: `Primary Keyword - Modifier | Brand`. One unique title per URL; one separator project-wide.
- Match intent over char count. Don't keyword-stuff (engines rewrite manipulative titles). Don't reuse the homepage title on deep pages.

## Meta Description
- **~150–160 chars** desktop (~120 mobile); front-load value in the first ~100 chars.
- Pattern: `[focus term] + [concrete value] + [action verb]`. Not a ranking factor — a **CTR** factor.
- Unique per URL; include a CTA when apt. Engines rewrite a majority of them — aim for rewrite-resistant intent alignment.

## Meta Keywords
- **Dead. Omit entirely.** Ignored by major engines for well over a decade; treated as a spam signal by some. Generating one ships noise.

## Heading Hierarchy (H1–H6)
- **One H1 per page**, matching/expanding the title intent. **H2** primary sections, **H3** sub-sections — never skip levels.
- Phrase H2/H3 as **questions** when the section answers one — strong AEO/citation win.
- Headings are structure, not styling (use CSS for size). Never wrap a logo in H1.
- **Why double-important now:** AI crawlers rely heavily on heading-driven chunking to decide what to cite. Clean hierarchy = higher citation odds.

## Body Content & Semantic HTML5
- Exactly one `<main>` per page; `<article>`/`<section>`/`<aside>`/`<nav>`/`<header>`/`<footer>` used semantically.
- Short paragraphs (2–4 sentences), avg sentence <20 words. Use `<ul>`/`<ol>`/`<table>` — disproportionately extracted by AI engines. Bold key claims with `<strong>`.
- **Definitive opening sentence** (`"X is Y that does Z."`) — that's what LLMs lift verbatim.

## Image SEO
- Format priority **AVIF → WebP → JPEG** via `<picture>`. Always set `width`+`height` (prevents CLS).
- Descriptive `alt` (no "image of"); empty `alt=""` for decorative (don't omit). Descriptive filenames.
- **Never lazy-load the LCP image**; use `fetchpriority="high"` on it. `srcset`/`sizes` for responsive.

## Internal Linking & Anchor Text
- Descriptive anchors (never "click here"). Mix exact/partial/branded; avoid over-optimized exact-match.
- Important pages within ~3 clicks of home. Internal links dofollow.
- External: `rel="nofollow"` (untrusted), `sponsored` (paid), `ugc` (user content); always `rel="noopener"` on `target="_blank"`.
- **Hub-and-spoke**: pillar page ↔ cluster pages, each cluster on one long-tail intent; min ~3 internal links per new post.

## Core Web Vitals
> Thresholds drift — confirm current values at web.dev/vitals. As of 2025/2026:

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| **LCP** | ≤2.5s | ≤4.0s | >4.0s |
| **INP** (replaced FID) | ≤200ms | ≤500ms | >500ms |
| **CLS** | ≤0.1 | ≤0.25 | >0.25 |

Measured at the **75th percentile of real-user (CrUX) field data**; a confirmed ranking signal.
- **LCP:** preload LCP image (`fetchpriority="high"`), defer non-critical JS, modern formats, TTFB <~600ms (CDN/edge), `font-display: swap`.
- **INP:** break long tasks (`scheduler.yield()`/`setTimeout(0)`), debounce input, `requestIdleCallback`/workers, audit third-party scripts (the #1 INP killer).
- **CLS:** dimensions on every image/iframe (or `aspect-ratio`), reserve ad/embed slots, preload key fonts, fallback metric overrides.

## Technical SEO
- **Canonical:** self-referential on every indexable page, HTTPS, matches the sitemap URL. One per page.
- **Robots meta:** `index,follow,max-image-preview:large`. Use `noindex,follow` for thin/utility pages.
- **hreflang:** reciprocal pairs, `lang-COUNTRY` format (`en-US`, `en-GB`), one `x-default`, every alternate returns 200. Don't canonicalize across languages while declaring hreflang.
- **Sitemap.xml:** only canonical, indexable, 200 URLs; accurate `lastmod`; referenced from `robots.txt`; split at 50k URLs / 50MB.
- **Pagination:** `rel=prev/next` is retired — each page self-canonicals, unique `<title>`, internally linked.
- **URLs:** lowercase, hyphenated (never underscores), ASCII, short slugs; one trailing-slash convention; strip tracking params at the canonical.
- **Redirects:** 301/308 permanent, 302/307 temporary; **zero redirect chains** (point internal links at the final URL).

## AI-Era SEO (AEO / GEO / LLM SEO)
AI engines are **decoupling from classical rank** — a growing share of AI-cited URLs do not rank in the classical top-10 (verify current data). Optimize for both.

**Citation patterns that move the needle:**
- **Definitive opening sentence** (`"X is Y that does Z."`) — first 1–2 sentences get lifted.
- **Question-as-heading + direct answer** in the first 1–3 sentences (TL;DR pattern).
- **Quotable atomic claims** with concrete numbers + dates; **stats with attribution + dates**.
- **Lists / tables / comparisons** are disproportionately cited.
- **Entity clarity** — name and define entities; link to Wikipedia/Wikidata; `sameAs` in Organization schema.
- **Author + Organization schema** with `sameAs` to disambiguate.
- **Freshness** — quarterly updates with a visible "Last updated" date; stale pages lose citations faster.

**robots.txt for AI crawlers — strategic split** (crawler names + stances evolve; verify current list before shipping):
```
# Search-visibility crawlers — usually ALLOW (citation upside)
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ChatGPT-User
Allow: /

# Training-only crawlers — pick your stance
User-agent: GPTBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: Google-Extended
Disallow: /
```
**llms.txt** — emerging convention; no major LLM officially confirms reading it. Treat as cheap insurance, not core strategy.

## Open Graph & Twitter Cards
Minimum: `og:title`, `og:description`, `og:image` (+`:width`/`:height`), `og:url`, `og:type`, `twitter:card=summary_large_image`, `twitter:image`.
- **1200×630 (1.91:1)** universal sweet spot; <5MB; center critical text (edges crop). Absolute HTTPS URLs. Version the URL when changing (caches).

## JSON-LD Structured Data
JSON-LD only; mark up only content actually on the page. **Pages with valid structured data are markedly more likely to surface in AI Overviews.**
- **High-ROI types:** `Organization` (+`sameAs`), `WebSite` (+`SearchAction`), `BreadcrumbList`, `Article`/`BlogPosting`, `Product`+`Offers`+`AggregateRating`+`Review`, `Person`, `VideoObject`, `Event`.
- **Reduced SERP value (verify current status):** `FAQPage`/`HowTo` rich results were retired for most sites — markup still aids AI parsing; ship only if the content genuinely is Q&A/steps, don't expect SERP enhancement.
- Validate with the Rich Results Test + Schema Markup Validator.

## E-E-A-T & Content Quality Gate
Experience, Expertise, Authoritativeness, Trust. First-hand **experience** is the differentiator vs AI slop. AI content is allowed; *low-value* content is not.
- Author byline + credentials + author page (`sameAs`); visible publish/modified dates; original media; cited primary sources; "why are *we* qualified?" answered above the fold; first-person experience markers for YMYL/review content.

## Universal Skip List
Meta keywords · conflicting canonicals · `noindex`+`Disallow` on the same URL · carousel as LCP · hidden "SEO" text · auto-translated hreflang without QA · lazy-loaded LCP · generic anchors · schema stuffing · scaled/templated content abuse · doorway pages · cloaking.

## Output Format (when auditing)
Per finding: **Severity** (CRITICAL/HIGH/MEDIUM/LOW/INFO) · **Phase/area** · **Location** (file:line or URL+element) · **Issue** (one sentence) · **Fix** (exact change) · **Impact** (classical / AI / both). When a page is solid, say so and name what's protecting it.

## One-Line Distillation
> **Write for humans first; structure ruthlessly so machines (Google + LLMs) can chunk, cite, and rank you.**
