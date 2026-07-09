# SpiritScroll Redesign Plan — Clone MAL `/topanime.php`

Target: `https://myanimelist.net/topanime.php`

## Layout Anatomy (MAL `/topanime.php`)

```
┌──────────────────────────────────────────────────────────┐
│  TOP NAVBAR (dark blue)                                   │
│  [Logo] [Anime▾] [Manga▾] ... [Search] [Login] [SignUp]  │
├────────┬────────────────────────────────────┬─────────────┤
│ SIDEBAR│  Breadcrumb: Top > Anime > T...    │  RIGHT SIDEBAR
│        │                                    │
│ All Ani│  #  │ Cover │ Title + meta   │Score│  More Top..
│ Top Air│  ───┼───────┼────────────────┼─────│  Top Airing
│ Top Upc│  1  │ [img] │ Sousou no Fri  │9.26 │  Most Pop..
│ TV Seri│      │       │ TV (28 eps)    │ N/A │
│ Movies │      │       │ Sep 2023 - ... │[Add]│
│ OVAs   │  ───┼───────┼────────────────┼─────│
│ ONAs   │  2  │ [img] │ Re:Zero S4     │9.18 │
│ Special│      │       │ TV (19 eps)    │ N/A │
│ Most Po│      │       │ ...            │[Add]│
│ Most Fa│  ───┴───────┴────────────────┴─────│
│        │         Next 50 →                  │
├────────┴────────────────────────────────────┴─────────────┤
│  FOOTER                                                   │
└──────────────────────────────────────────────────────────┘
```

## Design Tokens

| Token | Value |
|-------|-------|
| Page background | `#f0f2f5` |
| Content panel | `#fff` |
| Accent / links / header | `#2e51a2` (MAL blue) |
| Text primary | `#1a1a1a` |
| Text secondary | `#666` |
| Border | `#e5e5e5` |
| Status green (Reading) | `#4caf50` |
| Status blue (Completed) | `#2196f3` |
| Status yellow (On Hold) | `#ff9800` |
| Status red (Dropped) | `#f44336` |
| Status gray (Plan to Read) | `#9e9e9e` |
| Font | Outfit (keep existing) |
| Cover size (table) | `50×70 px` |
| Cover size (card) | `80×112 px` |

## Files

### NEW (5)

| File | Description |
|------|-------------|
| `client/src/components/TopNavbar.tsx` | MAL-style dark blue top bar: logo, nav links, search, scan button, settings gear |
| `client/src/components/Sidebar.tsx` | Left sidebar: status filter links (All/Reading/Completed/On Hold/Dropped/PTW) with count badges, type filter (Manhua/Donghua) |
| `client/src/components/RightSidebar.tsx` | Stats panel: total entries, chapters consumed, status distribution bars, latest NEW updates |
| `client/src/components/MediaTable.tsx` | Ranked table: columns `#` \| Cover \| Title+meta \| Progress \| Status \| Actions, with pagination |
| `client/src/components/MediaTableRow.tsx` | Single table row: rank number, cover thumbnail, title + "Ch./Ep. X / Y", progress bar, status badge, +/- buttons, edit icon |

### REWRITE (2)

| File | Description |
|------|-------------|
| `client/src/components/Layout.tsx` | Replace bottom tab bar + centered container with: TopNavbar + Sidebar + main content + RightSidebar, light theme shell |
| `client/src/index.css` | Switch from dark to light theme, apply `@theme` variables, style scrollbar, reset body bg |

### MODIFY (4)

| File | Description |
|------|-------------|
| `client/src/components/Dashboard.tsx` | Replace card grid with `MediaTable`. Move status tabs to Sidebar. Add table↔card view toggle. Add pagination. |
| `client/src/components/MediaCard.tsx` | Restyle to light theme. Keep for mobile/card fallback. |
| `client/src/components/Settings.tsx` | Restyle to light theme. |
| `client/src/components/EditMediaDialog.tsx` | Restyle modal: white bg, lighter inputs, MAL-blue buttons. |
| `client/src/components/NewEntryDialog.tsx` | Restyle modal to match. |
| `client/src/components/Login.tsx` | Restyle to light theme. |

### NO CHANGE

- All `server/` files
- `client/src/hooks/useMedia.ts`
- `client/src/lib/api.ts`
- `client/src/types/index.ts`
- `client/src/context/*`
- `extension/`

## Column Mapping

| MAL Column | SpiritScroll Column |
|------------|---------------------|
| Rank (#) | Row number |
| Cover | Small cover thumbnail (50×70) |
| Title + metadata (type, eps, dates, members) | Title + "Ch. X / Y" + source link |
| Score (9.26) | Progress bar + percentage, or "X / Y" |
| Your Score (N/A) | Status badge (READING=green, COMPLETED=blue, etc.) |
| Add to List button | Quick actions: [+][-] buttons + edit icon |

## Implementation Order

1. **Theme + Layout Shell** — `index.css`, `Layout.tsx`, `TopNavbar.tsx`, `Sidebar.tsx`
2. **Table View** — `MediaTable.tsx`, `MediaTableRow.tsx`
3. **Dashboard Rework** — `Dashboard.tsx` (replace grid with table + pagination)
4. **Right Sidebar** — `RightSidebar.tsx` (stats)
5. **Restyle Remainder** — `MediaCard.tsx`, `Settings.tsx`, dialogs, `Login.tsx`
