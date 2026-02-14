# Hidden Mood Filters

## Currently hidden
- **Geburtstag** (Birthday) – no tagged events yet
- **Nightlife** – no tagged events yet

## Where to re-enable
Uncomment the lines in these 2 files:

1. `src/components/HeroFilterBar.tsx` – Homepage filter bar (line ~55)
2. `src/components/ListingsFilterBar.tsx` – Event list filter bar (line ~50)

Search for `HIDDEN – re-enable when content is ready` to find the exact lines.

## Before re-enabling
Make sure events are tagged with the corresponding mood in the database (`tags` column must include `"nightlife"` or `"geburtstag"`).
