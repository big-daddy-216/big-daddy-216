# Turning the jam board on

One-time setup, mostly in the Cloudflare dashboard.

> **No Wrangler here — same arrangement as the Ohio Crash Scanner.** Wrangler
> can't run on Windows ARM64: its runtime `workerd` has no build for that
> platform (there's no `@cloudflare/workerd-windows-arm64` package at all), and
> because the runtime loads at CLI startup it crashes on *every* command, not
> just the local ones. So this project does what the crash tool's playbook
> does — *"Deploy via cloud build; skip the local CLI"*: Cloudflare's own Linux
> builders do the deploy from git, and the admin jobs are a plain-Node script
> against the REST API (`scripts/d1.mjs`), the same way the licensing CLI is
> *"plain Node — no Wrangler"*.
>
> Wrangler is deliberately not a dependency of this repo. Adding it back would
> break `npm install`, because `workerd`'s install step fails on this machine.
>
> The one thing genuinely lost is `wrangler pages dev`, so the **board can't be
> exercised locally** — use a Cloudflare preview deployment instead (step 5).
> Everything else about the site develops locally exactly as before.

Until this is done, the site works as it always has: the studio, the keyboard,
the grid and the `.mid` download are all unaffected. The board simply says it
can't be reached.

---

## 1. The bucket (for samples, music and video)

1. **R2 → Create bucket** → name it `bigdaddy-media`. Any region.
2. Open it → **Settings → Public access → Connect Domain** →
   `media.bigdaddyand.co`. Cloudflare adds the DNS record itself, because the
   domain is already yours. This is a brand-new record; it doesn't touch the
   live site.
3. Same Settings page → **CORS Policy** → paste this and save:

```json
[
  {
    "AllowedOrigins": [
      "https://bigdaddyand.co",
      "https://www.bigdaddyand.co",
      "https://big-daddy-216.pages.dev"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["range"],
    "ExposeHeaders": ["content-length", "content-range", "accept-ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

**Don't skip the CORS step.** Without it, published mic samples fail to load
with an error that looks like a broken audio file rather than a settings
problem. Music and video are unaffected by it — only the jam samples need it.

> Anything in this bucket is readable by anyone who has its address. That's
> fine for music you're publishing. Don't put unreleased material in it.

## 2. The database

1. **Workers & Cloudflare → D1 → Create database** → name it `bigdaddy`.
2. Copy the **Database ID** into `wrangler.toml`, replacing
   `PASTE-D1-DATABASE-ID-HERE`. Commit that change.
3. Apply the schema, either way round:

   **From this machine** (preferred — it keeps a record of what's applied):

   ```bash
   npm run db:migrate
   ```

   That needs three values in `.dev.vars` — copy `.dev.vars.example` and fill
   in `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and a `CLOUDFLARE_API_TOKEN`
   created under **My Profile → API Tokens** with the **D1:Edit** permission
   and nothing else. It records each migration in a `_migrations` table, so
   running it twice does nothing the second time.

   **Or from the dashboard**: open the database → **Console** → paste the whole
   of `migrations/0001_jams.sql` → **Execute**. Paste the file *whole* — the
   immutability trigger has semicolons inside it, so running it a statement at
   a time will cut the trigger in half and silently leave jams editable.

`0002_media.sql` is the music library — the table the upload panel on
`music.html` writes to. Apply it the same way (it's already in on the live
database).

Check it worked:

```bash
npm run db:status
```

## 3. The site

1. **Workers & Pages → Create → Pages → Connect to Git** → pick the
   `big-daddy-216` repository.
2. **Framework preset: None. Build command: leave empty. Build output
   directory: `/`.** There is no build step and adding one will break things.
3. Production branch: `main`.
4. Deploy. You'll get an address like `big-daddy-216.pages.dev` — the real site
   at `bigdaddyand.co` carries on untouched for now.

## 4. Connect the bindings and secrets

In the Pages project → **Settings**:

**Bindings** (add both, for Production *and* Preview):

| Type | Variable name | Points at |
|---|---|---|
| D1 database | `DB` | `bigdaddy` |
| R2 bucket | `MEDIA` | `bigdaddy-media` |

**Variables and secrets.** On a machine where Node runs (this one is fine —
it's only the Cloudflare tool that won't):

```bash
node scripts/hash-passphrase.mjs "three random words you pick"
```

That prints four lines. Add each as an **encrypted** variable, to **both**
Production and Preview:

- `JAM_PASSPHRASE_HASH` — the band word, stretched. The word itself is never
  stored anywhere; keep it in your head or your password manager.
- `SESSION_HMAC_KEY` — signs the "you may post" cookie.
- `IP_SALT` — so rate limiting can count without ever storing an address.
- `ADMIN_TOKEN` — lets you take anything down.

Add one plain (non-secret) variable too:

- `MEDIA_BASE_URL` = `https://media.bigdaddyand.co`

Optional: `MEDIA_MAX_BYTES` caps a song upload (default 80 MB, which sits
under the 100 MB request limit on the free plan). Uploads only need the
band word, so the same `ADMIN_TOKEN` also lets `scripts/upload-song.mjs`
post from your own machine.

> **Set these for Preview as well as Production.** It's the easiest thing to
> forget, and every preview build fails on the first sign-in without them.

## 5. Try it before you move the domain

Open `https://big-daddy-216.pages.dev/jam.html` and:

- build a couple of bars, give it a name, type the band word, publish;
- reload — it should be on the board;
- press **Jam on this**, change something, publish again — the first jam should
  now say a version grew from it;
- record a mic sample, publish with the box ticked, then open the jam **on your
  phone** and confirm you can hear it.

That last one is the real test of the whole chain: browser → bucket → phone.

## 6. Move the domain over

Only once step 5 works.

1. **The day before**, in **DNS**, drop the TTL on the `bigdaddyand.co` and
   `www` records to 60 seconds. This is the thing that actually keeps the
   switch quick, and it has to happen in advance.
2. **Write down the current records** — that's your way back.
3. Pages project → **Custom domains** → add `bigdaddyand.co`, then
   `www.bigdaddyand.co`. Cloudflare replaces the records for you.
4. **Leave GitHub Pages switched on for at least a week.** Restoring the old
   records is the rollback, and while any stale resolver still points there,
   visitors get the same site — just without the board, which says so politely
   rather than breaking.

Afterwards, check that an old `jam.html#loop=…` link from an email still opens
and plays. Those links don't touch the back end and must keep working.

## 7. Optional: move the two existing videos into the bucket

The two `Chasing Big Daddy` clips (about 10 MB) are still committed to the
repository, and `videos.html` plays them from there — so the page works with no
setup at all. Moving them is tidiness, not a requirement: it slims the repo and
puts all the media in one place.

When you want to:

1. **R2 → `bigdaddy-media` → Upload** the four files in `assets/video/` into a
   `video/` folder.
2. In `assets/data/catalog.js`, shorten the four paths — `assets/video/x.mp4`
   becomes `video/x.mp4`. Anything not starting with `assets/` is treated as a
   bucket key.
3. Check `videos.html` on the preview address, **including dragging the
   scrubber** — that's what proves the bucket is serving range requests properly.
4. Only then delete the files from `assets/video/` and update the two paths in
   `window.BD_VIDEOS` near the top of `index.html`, which the home page uses.

Don't rewrite git history to purge the old copies; it isn't worth the risk for
10 MB.

## 8. Optional: a second wall against spam

**Security → WAF → Rate limiting rules**: one rule on
`URI Path starts with /api/`, 60 requests per minute per IP. The board already
limits publishing (10/hour) and passphrase guessing (10/hour) in its own code;
this is just a cheaper outer layer.

---

## Taking something down

From this machine:

```bash
npm run jams              # the last 20, with their ids
node scripts/d1.mjs hide abc123def456
node scripts/d1.mjs unhide abc123def456
```

Or from the D1 **Console**:

```sql
UPDATE jams SET status = 'hidden' WHERE id = 'the-jam-id';
```

Rows are never deleted — anything built on that jam keeps working, and the page
shows it as withdrawn. `'hidden'` is the band taking it down; `'removed'` is the
poster doing it themselves.

## What it costs

Nothing, at this scale. R2 gives 10 GB and charges nothing for people
downloading it; D1 gives 5 GB and five million reads a day; Functions give
100,000 requests a day. A four-second sample is about 176 KB, so ten thousand
jams would be under 2 GB.
