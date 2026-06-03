# Web Frontend Build Patterns

> Durable reference for generating or advising on **web-frontend projects** — marketing sites, landing pages, portfolios, content/app shells. Distilled from a 2026-06 research wave + deep-dives across ~14 of the top website/template repos on GitHub.
>
> **Read this when** a project is web-frontend-shaped (Next / React / Astro / Vue marketing or content site) — *especially* anything that captures user data or wants premium motion.
>
> **Shelf-life note (anti-poison):** the **patterns** below are durable. Any specific repo name, version number, or popularity signal **decays** — re-verify before relying (`gh search repos`, check the LICENSE file + last-push date). Treat the repo list in §6 as "starting points to evaluate," never as current fact.

---

## 1. The universal compliance gap — highest-value finding

Open-source website templates — even the most-starred — **almost never ship the legal/consent layer.** Across the repos surveyed, essentially none shipped a cookie-consent/CMP, analytics loaded unconditionally (no consent gate), and privacy/terms pages were absent or Lorem-Ipsum placeholders.

**Implication:** for any generated web project that captures user data (forms, analytics, cookies), the compliance layer is *the builder's* job, not the template's. Bake this checklist into web-project generation:

- [ ] **Cookie-consent / CMP** that gates all non-essential cookies + analytics *before* they load — usually a launch-blocker, not a nice-to-have.
- [ ] **Privacy notice** — data-controller identity, lawful basis per purpose, sub-processor list, retention, data-subject rights, complaint route.
- [ ] **Cookie policy** — categorised (necessary / functional / analytics / marketing) + cookie table + how to withdraw consent.
- [ ] **Terms of service.**
- [ ] **Consent-gated analytics** — never load Vercel Analytics / GA / PostHog / Sentry unconditionally.
- [ ] **Lawful-basis UX on every form** — unticked-by-default consent checkbox; capture + log consent.
- [ ] **Jurisdiction disclosure** — UK Ltd: registered name + company number + address in footer; EU: Impressum.
- [ ] **Security headers** — CSP / HSTS / X-Frame-Options; templates omit these.

Region cues: **UK** → UK GDPR + PECR + ICO + Companies House · **EU** → GDPR + ePrivacy + Impressum · **US** → CCPA/CPRA. Adapt the specifics; the *gap* is universal.

## 2. Animation ≠ accessible animation — always close this gap

Premium motion libraries ship impressive effects but **rarely ship `prefers-reduced-motion` guards** — in the libraries surveyed, only a tiny fraction of components handled it. Unguarded motion is an accessibility failure (and, in ad-claim-regulated markets, a credibility/polish risk).

- **Adopt a global reduced-motion kill-switch** as standard: a `usePreferredReducedMotion()` hook (`useSyncExternalStore` over the media query) **plus** a global `@media (prefers-reduced-motion: reduce)` rule that disables animation/transition. Wire it in *before* adding effects, so everything is gated by default.
- **Wrap every lifted animated component** — short-circuit JS motion via the hook; rely on the global CSS rule for keyframe effects.
- Make reduced-motion a **definition-of-done** on animated work, not an afterthought.

## 3. The premium-motion stack — what "award-tier" is built on

- **GSAP** — timelines + ScrollTrigger; the standard for scroll choreography.
- **Lenis** — smooth scroll; pairs with GSAP ScrollTrigger.
- **Motion** (formerly Framer Motion) — declarative React animation; default for component-level motion/transitions.
- **React Three Fiber + drei (+ postprocessing)** — WebGL/3D; the `View`/scissor pattern embeds 3D in DOM content sites.
- **Theatre.js** — sequencing/tooling for complex timelines.
- **Lottie** — designer-authored vector animation.

**Techniques that read as premium:** scroll-triggered reveals, parallax, route/page transitions, staggered reveals, magnetic/cursor effects, a WebGL/shader hero. **Orchestration:** drive Lenis + GSAP + R3F off a *single shared RAF* (one render loop), not competing loops.

**Restraint rule:** match motion intensity to audience. For credibility-sensitive buyers (professionals, enterprise, regulated industries), favour subtle reveals + micro-interactions over flashy cursors / confetti / warp effects.

## 4. License landmines — check before lifting any code

- **Commons Clause** (on some component libs): you may *use* the components in a site, but **may not redistribute/resell** them. Reference-only for derivative libraries.
- **GPL/copyleft templates** — lifting markup can impose copyleft; verify before proprietary/client reuse.
- **Bundled fonts are NOT covered by the repo's code license** — e.g. SF Pro is Apple-licensed; never ship it. Swap for OSS/licensed fonts.
- **No LICENSE file = all rights reserved** (default copyright) — common on tutorial/portfolio repos. Take *technique*, not code.
- **Empty / NOASSERTION license** — confirm intent (often MIT in `package.json`/README) before relying; add a proper notice when forking.

Always read `LICENSE` **and** check bundled assets (fonts, images, icons) separately from the code license.

## 5. SEO / metadata plumbing — universally needed, usually omitted by showcases

Showcase/portfolio repos skip this; production starters do it well — adopt their patterns:

- **Framework metadata API** for title/description/OG/Twitter/canonical (Next: the Metadata API + per-page `generateMetadata`).
- **Dynamic `sitemap` + `robots`** (Next: typed `app/sitemap.ts` + `app/robots.ts`).
- **Per-page dynamic OG images** (Next: `next/og` `ImageResponse`, edge runtime).
- **Structured data** — site-wide `Organization` JSON-LD (include legal-entity details where applicable) + `Article`/`WebSite` as needed.
- **`manifest` + favicons + `metadataBase`.**
- **Locale** — set the correct one (e.g. `en-GB` vs `en-US`); templates default to `en-US`.

## 6. Canonical reference repos — re-verify before relying (see shelf-life note)

Categorised starting points. **Star counts deliberately omitted** (they decay). Confirm current maintenance/version/license yourself before adopting. If a local reference collection exists, deep-dive it; otherwise clone fresh from upstream.

- **Animated component libraries (copy-paste / shadcn-registry):** magicui, motion-primitives, cult-ui, animate-ui (⚠️ Commons Clause — use, don't redistribute), fancy.
- **Production Next/React starters (premium motion + SEO wired):** darkroomengineering/satus, steven-tey/precedent.
- **Motion / 3D libraries & starters:** GSAP, Lenis, Motion, pmndrs (react-three-fiber / drei / react-three-next), basementstudio/scrollytelling, 14islands/r3f-scroll-rig.
- **Motion + business-plumbing exemplar (Remix):** HamishMW/portfolio — contact-form + SEO + a11y patterns worth porting.
- **Compliance / legal-page patterns:** Blazity/next-saas-starter (patterns only — dated stack); Astro `astrowind` / `al-folio` are the strongest privacy/SEO/GDPR exemplars to read even if off-stack.
- **Landing templates:** cruip/* (⚠️ verify GPL/attribution), ixartz Next landing, PageAI page-ui.

> Purpose of this section: avoid re-discovering the field from scratch — **not** to assert current rankings. Confirm each before adopting.

---

**Provenance:** 2026-06 website/template research wave (top-starred GitHub website/template repos reviewed across animation quality, technical excellence, and business/compliance completeness). Patterns are durable; specifics decay — re-verify.
