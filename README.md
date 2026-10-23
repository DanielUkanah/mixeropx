# MixerOpX

Accounts for a concrete mixer truck: invoices, money in, site expenses with receipts, reports, and a naira/pound toggle for the owner.

    npm install
    npm run dev      # http://localhost:3000

Change the app name in `lib/brand.ts`.

## Exchange rate
The rate is fetched from `/api/rate` (open.er-api.com, free, attribution required) and rounded to the nearest 10 naira.
Every expense and payment stores the rate from the day it was recorded, so old pound figures never change.
Settings has a Manual mode if you want to type the rate yourself.

## Important
Data (and receipts) are saved in the browser for now, so the manager and the owner do NOT see the same numbers yet.
All reads and writes go through `lib/store.tsx`, so the next step is swapping it for a shared database (Supabase works well)
plus a login for the owner and the manager. Email preferences in Settings are saved but nothing is sent until there is a server.
# mixeropx
