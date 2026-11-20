## Mailing list

A Cloudflare Worker that takes sign-ups from the subscribe form on the site and mails each new
entry of `/feed/email.xml` (attested posts, a day after signing) to confirmed subscribers.

- Storage: a D1 database, `cdrn-mail` (`schema.sql`).
- Sending: Resend, from the address in `MAIL_FROM`. The key is the `RESEND_API_KEY` secret.
- Timing: a cron trigger reads the feed hourly. A subscriber gets an entry if it was released
  after they confirmed and they haven't had it yet.

```
npx wrangler d1 create cdrn-mail                      # once; put the id in wrangler.toml
npx wrangler d1 execute DB --remote --file schema.sql
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Then set `PUBLIC_URL` in `wrangler.toml` and `newsletter.subscribeUrl` in `_data/metadata.js`
to the Worker's address.

`node test/e2e.mjs` runs sign-up, confirm, send-once and unsubscribe against a local Worker with
a stand-in for Resend.
