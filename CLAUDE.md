# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static site showing verified PIX payment proofs for @NextlevelDJ campaigns. Single-page HTML, no framework, no build step. Deployed on Vercel.

## Deployment

```bash
# Always run from project root, not from subdirectories
vercel --prod --yes

# The custom alias must be reset after every production deploy
vercel alias set <new-deployment-url> comprovantes-dj.vercel.app
```

- **Vercel project**: `comprovantes-dj` (team `ilankriger-gmails-projects`)
- **Public URL**: `comprovantes-dj.vercel.app`
- **Custom domain**: `acoes.nextleveldj.com` (DNS managed at the main `nextleveldj.com` site, not by this Vercel project)
- **GitHub repo**: `ilankriger-gmail/pix-pagamentos`

## Architecture

Everything is in `index.html` — HTML, CSS, and JS inline. No tooling.

- **`index.html`** — CTA banner → hero (tag, h1, paragraph, hero CTA pill, stats) → section label → page switcher (numbered tabs) → tab-content page blocks → footer → modal → script
- **`comprovantes/`** — JPG payment proofs, named `{number}-{firstname}.jpg`, numbered sequentially across the entire site (not per-campaign, not per-month)
- **`Novos comprovantes/`** — staging folder for raw `IMG_*.jpg` screenshots before they're renamed and copied into `comprovantes/`. Not deployed.
- **`.env.local`** — Vercel env vars (do not commit, do not deploy)

## Data Placement Rules

These are the rules that govern how new payments and campaigns are added — follow them strictly so the site stays consistent.

### 1. Comprovante files (`comprovantes/`)

- **Naming**: `{number}-{firstname}.jpg`, lowercase, no accents (e.g. `42-larissa.jpg`, `48-gledson.jpg`).
- **Numbering is global and sequential**: take the highest existing number and continue from there. Never restart per month or per campaign. Two winners with the same first name are fine — the unique number disambiguates them (e.g. `01-geovana.jpg` and `43-geovana.jpg`).
- **First name selection**: prefer the name on the PIX receipt; if the person goes by a clearly different name on their Instagram handle, use whichever is more recognizable, but pick one and be consistent.
- **One file per winner**: if you have two screenshots of the same transaction (sender view + recipient view, e.g. Santander + Nubank), pick one and discard the other. Do not number the same person twice.
- Source images usually come from `Novos comprovantes/` — copy (`cp`), don't move, so the original folder is preserved as a backup.

### 2. Campaign HTML blocks (inside `.tab-content`)

Each campaign is one `<div class="campaign">` containing a `.campaign-head` (icon, name, sub-line, badge) and a `.winners` grid.

- **Page order**: campaigns are split into numbered pages (`Página 1`, `Página 2`, …) of ~6 campaigns each, newest first; Page 1 is `.active`. New campaigns go at the **top of Page 1**; when a page exceeds ~6, push the oldest campaign(s) down to the next page. Keep the page button order AND the `.tab-content` block order in sync. The month is no longer a tab — it lives only in each `campaign-sub`.
- **`campaign-icon`**: an emoji that visually represents the brand (`🔴` iFood, `💳` PagBank, `🚀` Emergent, `🥟` Pastel-themed Emergent ação, etc.).
- **`campaign-sub`** format: `"<Mês> <Ano> · <N> ganhadores"`. If the campaign has pending winners, append `· <N> pendentes`. Example: `"Maio 2026 · 6 ganhadores · 3 pendentes"`.
- **`campaign-badge`** format: `"R$ <total-pago>"`. This reflects only what has actually been paid out, not the committed total. When a pending winner is paid, update both the badge value and the sub-line counter.

### 3. Winner rows inside `.winners`

Two row types — they look similar but have different markup and behavior:

**Paid winner** (clickable, opens modal):
```html
<a class="winner" href="comprovantes/42-larissa.jpg" target="_blank">
  <div class="winner-avatar">L</div>
  <div><div class="winner-name">Larissa C.</div><div class="winner-amount">R$ 100 ✓</div></div>
  <span class="winner-arrow">↗</span>
</a>
```

**Pending winner** (no link, no comprovante yet):
```html
<div class="winner pending">
  <div class="winner-avatar">Y</div>
  <div><div class="winner-name">Y. Camargo</div><div class="winner-amount pending">R$ 100 · pendente</div></div>
</div>
```

Rules:
- **Paid uses `<a>`, pending uses `<div>`** — the modal JS targets `a.winner` specifically, so `<div class="winner">` will not open a modal (intentional).
- **`winner-avatar`** is the first letter of `winner-name`, uppercase.
- **`winner-name`** is `<First name> <Last initial>.` (e.g. `Larissa C.`). For people without a last name initial available, just first name (`Wagner`, `Jaqueline`).
- **`winner-amount`**: paid uses `R$ <valor> ✓` (green); pending uses `R$ <valor> · pendente` and the `.pending` class on `.winner-amount` for yellow color.
- When a pending winner is paid: swap the `<div>` for an `<a href="comprovantes/XX-name.jpg">`, change the amount text, drop the `.pending` class, and add the `.winner-arrow`.

### 4. Hero stats

The four stats reflect **only what's been paid**, not commitments:

- **Pessoas** — total count of paid winners (sum of all `<a class="winner">`).
- **Distribuídos** — sum of paid amounts in the `R$X.Yk` short form (e.g. `R$5.5k`).
- **Ações** — total number of campaign blocks (`.campaign`) on the site, counting all pages.
- **Verificado** — always `100%`.

Update all four every time a comprovante is added or a pending winner is paid.

### 5. CTA links

Two CTAs both link to the same Link do Bem URL: `https://tv.linkdobem.com/?id=ik119_yt`.
- Top `.cta-banner` — slim green strip across the top.
- `.hero-cta` — large green pill button in the hero, with pulsing ring animation.
Keep both URLs in sync if the destination changes.

## Key Patterns

- **Pages (tabs)**: pure JS, toggles `.active` on `.tab-btn` and on `.tab-content` (`tab-p1`, `tab-p2`, `tab-p3`, …). Page IDs are `tab-p<n>`, the button uses `data-tab="p<n>"`, and the label is `Página <n>`. ~6 campaigns per page, newest page first.
- **Modal**: clicking any `a.winner` sets `#modalImg.src` to its `href` and adds `.active` to `#modal`. Click outside the image, the close button, or `Escape` closes it.
- **CSS variables** (in `:root`): `--green`, `--green-dim`, `--green-border`, `--yellow`, `--yellow-dim`, `--yellow-border`, `--bg`, `--surface`, `--surface2`, `--border`, `--text`, `--muted`, `--muted2`. Use these — don't hardcode hex values.
- **Fonts**: Plus Jakarta Sans (headings, stat numbers, avatars) + Inter (body) — already loaded from Google Fonts.
- **Responsive breakpoint**: 600px (single block at the bottom of the `<style>` tag).

## Adding a New Campaign — checklist

1. Copy comprovante JPGs into `comprovantes/` with the next available numbers, renamed `{n}-{firstname}.jpg`.
2. Add a `<div class="campaign">` block at the **top of Page 1** (`#tab-p1`) — newest first. Fill icon, name, sub (`<Mês> <Ano> · <N> ganhadores`), badge.
3. Keep ~6 campaigns per page: if Page 1 now has more than ~6, push the oldest campaign(s) down into the next page. To add a new page, create a `<button class="tab-btn" data-tab="p<n>">Página <n></button>` and a sibling `<div class="tab-content" id="tab-p<n>">…</div>` (and remove `.active` from the previously-active tab + button so Page 1 stays active).
4. Add one row per winner — `<a>` for paid, `<div class="winner pending">` for unpaid.
5. Recalculate and update all four hero stats.
6. `vercel --prod --yes` from project root, then `vercel alias set <new-url> comprovantes-dj.vercel.app`.

## Language

All user-facing text is in **Brazilian Portuguese** with proper accents (ç, ã, á, é, í, ó, ú, ê, ô). Tab labels, sub-lines, badges, button text, footer — all PT-BR. CSS class names, IDs, and file names stay in English/no-accent.
