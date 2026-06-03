---
name: consent-cmp
description: Scaffold a compliant cookie-consent / Consent Management Platform (CMP) layer for a web project — a banner UI, a consent store, and (the part that matters) the GATE that withholds all non-essential cookies/scripts until opt-in, plus a cookie inventory and privacy/cookie-policy wiring. Activates on "cookie consent", "GDPR/CCPA banner", "CMP", "we need consent", or before launching any web project that sets cookies or loads analytics.
---

# Consent / CMP Scaffolder

Open-source website templates almost never ship a consent layer, and they load analytics unconditionally. For anyone who is a Data Controller (e.g. from the first lead-email capture), that is a compliance failure on launch. This skill scaffolds a real consent layer — correctly, every time — instead of letting each project reinvent it (and get it subtly wrong).

> **Boundary:** security headers (CSP / HSTS / X-Frame-Options) are owned by the `security` skill — reference it, don't re-implement here. This skill owns **consent**: cookies, the gate, and the policy pages.

## The one principle that makes a CMP real, not theatre

Most consent banners are theatre: the banner shows while analytics has *already* fired. Compliance (GDPR/PECR and similar opt-in regimes) requires **prior, opt-in consent** — so the **gate**, not the banner, is the substance:

- **Non-essential cookies/scripts MUST NOT load before opt-in.** Default everything non-essential to *off*.
- **No pre-ticked boxes**; no "by continuing you accept".
- **Reject must be as easy as accept** (one click, same prominence).
- A banner over already-fired trackers is non-compliant despite *looking* done.

## Procedure

### 1. Detect context
- **Jurisdiction:** UK → UK GDPR + PECR + ICO · EU → GDPR + ePrivacy · US → CCPA/CPRA (opt-*out* model differs — adapt). Pick the strictest applicable as the baseline.
- **Framework:** Next/Astro/Vue/etc. (affects how scripts are gated).
- **Trackers present:** analytics (Vercel Analytics, GA, PostHog), error monitoring (Sentry), embeds (video/maps), web-fonts, marketing pixels, A/B tools. Each is a thing the gate must hold.

### 2. Choose the approach (state the trade-off)
- **Self-built minimal** — for simple sites; full control, you own the categories + gate logic.
- **Established OSS CMP** — e.g. `vanilla-cookieconsent`, Klaro, Orejime (evaluate current maintenance/versions before adopting — names/versions drift).
- **Hosted CMP** — e.g. commercial consent platforms; fastest to "IAB TCF" compliance for ad-tech, but adds a third party + cost.

### 3. Scaffold three parts
- **Banner UI** — accept / reject / granular per-category toggles. Categories: **necessary** (always on, no toggle) · **functional** · **analytics** · **marketing**. Reject ≥ as easy as accept.
- **Consent store** — persist the choice + a **consent version** (re-prompt when the policy/categories change). A `localStorage`/cookie flag is fine; in React a `use-local-storage`-style hook is the natural home, exposed via context so the whole app reads consent state.
- **The gate** — the substance. Non-essential scripts load **only after** matching consent. In Next, conditional `<Script>` keyed off consent state; everything non-essential defaults off. Provide a single `hasConsent(category)` check used everywhere a tracker would mount.

### 4. Cookie inventory + policy wiring
- Produce a categorised **cookie table** (name · purpose · category · provider · retention) for the cookie policy.
- Wire links to the **privacy notice** + **cookie policy** pages (author the policy copy to the jurisdiction — don't ship Lorem Ipsum or generic US text; reuse the project's compliance skeletons if present).

### 5. Consent lifecycle
- Persistent **"manage cookies"** entry point (footer link) so users can change their mind — withdrawal must be as easy as granting.
- **Re-prompt on version bump** (new tracker/category added → consent version increments → banner re-shows).
- **Log consent** (timestamp + version + choices) where the jurisdiction expects demonstrable consent.

## Verification (the step DIY implementations skip)
- Open DevTools → Application/Storage + Network on a **fresh** session. Confirm **no non-essential cookie or script fires before opt-in.** That single check is the difference between a real CMP and consent theatre.
- Confirm reject truly blocks (not just hides the banner), and that "manage cookies" re-opens the choices.
- Confirm necessary-only is the pre-consent default state.

## Jurisdiction quick-reference
- **UK / EU:** opt-in. Prior consent required; granular categories; easy withdrawal; demonstrable consent. (UK also: PECR for cookies, ICO registration, Companies House identity on the site.)
- **US (CCPA/CPRA):** opt-*out* "Do Not Sell/Share" model — different UX (a link, not necessarily a pre-consent gate), but still implement category control.
- When serving multiple regions, geo-target the stricter flow or apply the strictest baseline globally.

## One-Line Distillation
> **The gate is the product, not the banner: nothing non-essential loads before opt-in. Verify it in the network tab.**
