# Resale Profit Calculator

A free calculator for people reselling things online. Enter what an item cost
you, what you're selling it for, and the platform's fees, and it shows what
you actually keep — plus your margin, your return on spend, the price you'd
break even at, and which platform leaves you with the most.

No accounts, no tracking, no analytics. Nothing is sent anywhere; every
calculation happens in your own browser.

## Running it

Open `index.html` in a browser. There is no build step, no install and no
server — it is three files of plain HTML, CSS and JavaScript.

## Files

| File | Purpose |
|---|---|
| `index.html` | Structure and content |
| `style.css` | All styling, light and dark |
| `script.js` | The calculations and the live updating |
| `fees.js` | Platform fee data — the only file you edit when fees change |
| `NOTES.md` | Working notes and exercises |

## Fee accuracy

Platform fees change, differ by country and category, and go stale quietly.
Two things guard against that:

- All fee data lives in `fees.js`, separate from any code, with a
  `lastChecked` date.
- The site reads that date and warns visitors when the figures are getting
  old, rather than presenting stale numbers as current.

If you spot a fee that's wrong, `fees.js` is the only file that needs
changing — and please update `lastChecked` while you're in there.
