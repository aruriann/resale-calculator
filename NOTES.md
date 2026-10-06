# Resale Profit Calculator — your notes

## Opening it

Double-click `index.html`. It opens in your browser. That's it — no server,
no install, no build step. Change a file, save, press F5 in the browser.

## What each file does

| File | Job | Analogy |
|---|---|---|
| `index.html` | The content and structure — what's on the page | The skeleton |
| `style.css` | How it looks — colours, spacing, layout | The clothes |
| `script.js` | What it does — the maths, the live updating | The muscles |

They connect in two places, both in `index.html`:
- `<link rel="stylesheet" href="style.css">` in the `<head>`
- `<script src="script.js"></script>` at the end of the `<body>`

## The one idea that makes the whole thing work

HTML elements have an `id`:

```html
<input type="number" id="salePrice">
```

JavaScript finds them by that id:

```js
document.getElementById("salePrice")
```

Once JavaScript has an element, it can read `.value` from it or write
`.textContent` into it. Everything else in `script.js` is that idea, repeated.

## How `script.js` is laid out

1. **Find the elements** — grab every input and output once, store them in `inputs` and `output`
2. **Helpers** — `readNumber()`, `money()`, `percent()`
3. **`calculate()`** — pure maths. Takes the numbers, returns the answers. Touches nothing on the page.
4. **`render()`** — takes those answers and writes them onto the page.
5. **The listener** — "whenever anything in the form changes, run `render()`"

Keeping 3 and 4 separate matters. You can redesign the page without any
risk of breaking the maths, and fix the maths without touching the layout.

## Your debugging tool

Press **F12** in the browser, click **Console**. Errors show up there with
a line number. You can also add `console.log(something)` anywhere in
`script.js` to print a value and see what it actually is.

Try it: add `console.log(r)` as the first line inside `render()`, save,
reload, and look at the console while you type in a box.

## Version 2: platform presets — the data/code split

The buttons for eBay, Vinted, Etsy and so on are **not** in `index.html`.
Look for them and you'll find only this:

```html
<div class="presets" id="presetButtons"></div>
```

An empty box. The buttons are built by `buildPresets()` in `script.js`, from
this list near the top of the file:

```js
const platforms = [
  { name: "eBay", feePercent: 13.6, fixedFee: 0.40, note: "..." },
  { name: "Vinted", feePercent: 0,  fixedFee: 0,    note: "..." },
  ...
];
```

**Why this matters more than the feature itself.** The code never mentions
eBay or Vinted by name. It walks the list and makes one button per entry.
So the list can have three platforms or fifty, and the code is identical.

Compare the two ways of adding Wallapop:

- *Hardcoded way:* write new HTML for the button, write a new click handler,
  remember to copy the styling. Three places, three chances to make a typo.
- *This way:* add one line to `platforms`. Done.

That's the whole idea: **information lives in a list; code does something to
each item in the list.** Almost every improvement you make from here is a
version of it.

Two things in there that catch people out, both commented in the file:
- `button.type = "button"` — a button inside a form submits the form by
  default, which reloads the page and wipes everything typed.
- Setting `input.value` from code does **not** fire the `input` event, so
  `applyPreset()` has to call `render()` itself.

## Version 3: fees go stale, so the site admits it

Fee data rots. The fix is in two halves.

**Half one: the data lives alone.** All fee numbers are now in `fees.js`,
which contains no logic whatsoever — just a list and a date. `script.js`
reads it with one line:

```js
const platforms = FEE_DATA.platforms;
```

Updating a fee is now editing one short, readable file. You cannot break the
calculator by changing a number, because the numbers and the code no longer
share a building.

> Why `fees.js` and not `fees.json`? Reading a `.json` file needs `fetch()`,
> and browsers block `fetch()` on pages opened straight from disk. A `.js`
> file loaded with a `<script>` tag has no such restriction, so the site
> still works by double-clicking `index.html`. Once it's on a real server,
> either would work — but there's no reason to give up the offline case.

**Half two: the site ages itself in public.** `reportDataAge()` compares
`lastChecked` against today and reacts without anyone remembering to:

| Age | What visitors see |
|---|---|
| Under 90 days | A quiet line in the footer with the date |
| Over 90 days | An amber warning above the buttons |
| Over 270 days | A red one that stops vouching for the numbers |

This is the part worth internalising. You can't stop data going stale. What
you *can* do is make the thing honest about its own age, so it degrades into
"check this yourself" instead of quietly lying. Any site that publishes facts
needs some version of this.

**So when a fee changes, the whole job is:** open `fees.js`, change the
number, change `lastChecked` to today. Two edits, one file, no code.

## Version 4: comparing every platform at once

The new table runs the same item through every platform's fees and sorts
best first. The interesting part is that **no new maths was written.**

The old `calculate()` had the sum welded to the form — it read the fee boxes
itself. So it could only ever answer one question. It got split in two:

```js
function profitFor(feePercent, fixedFee) { ...all the maths... }

function calculate() {
  return profitFor(readNumber(inputs.feePercent), readNumber(inputs.fixedFee));
}
```

`profitFor()` doesn't know where its numbers came from. That's the point.
Once it stopped caring, the comparison table became a loop that calls it
five times:

```js
const rows = platforms.map(function (platform) {
  return { name: platform.name, result: profitFor(platform.feePercent, platform.fixedFee) };
});
rows.sort(function (a, b) { return b.result.profit - a.result.profit; });
```

**The lesson: a function that takes what it needs as arguments can be reused;
one that reaches out and grabs its own inputs can't.** When a feature feels
like it needs the same logic "but slightly different", the answer is almost
always to pass the difference in as an argument rather than write it twice.
Two copies of a sum will drift apart, and then the site contradicts itself.

That's also why the headline figure and the table can never disagree — they
are literally the same function.

One honesty detail worth copying: the badge says "best" normally but "least
bad" when every platform loses money. Labels should stay true in the bad case,
not just the happy one.

## Exercises, easiest first

1. **Change a colour.** In `style.css`, change `--accent` near the top.
   Watch how much moves from one edit.
2. **Add a platform.** Add one entry to the `platforms` list in `script.js`.
   If the button appears and works without you touching anything else, you've
   understood the lesson above.
3. **Change the wording.** The verdict sentences live in `verdictFor()`.
4. **Add a field.** A "listing fee" input. Three steps: the HTML block (copy
   an existing `.field`, change the id and label), a line in the `inputs`
   object, a line in `calculate()`. First one that's a real small project.
5. **Sort the platforms alphabetically** before building the buttons.
   One line, if you look up `.sort()`.
6. **Add a column to the comparison table.** Return on spend is already
   calculated and sitting in the result object, unused. Two edits: a `<th>`
   in `index.html`, a `<td>` in `renderComparison()`.

## Ideas for later

- Remember the last values typed, using `localStorage`
- A "how much should I sell this for to make €X profit?" reverse mode
- Put it online — free on GitHub Pages, Netlify or Cloudflare Pages
