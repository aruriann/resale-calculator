/* ==========================================================================
   Resale Profit Calculator — the logic
   --------------------------------------------------------------------------
   How this file is organised:
     1. Finding the page elements
     2. Small helpers (reading numbers, formatting money)
     3. The actual maths
     4. Putting results back on the page
     5. Listening for changes
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. FIND THE ELEMENTS

   document.getElementById("itemCost") hands us the <input id="itemCost">
   from the HTML. We grab them once here and reuse them, rather than
   searching the page every time something changes.
   -------------------------------------------------------------------------- */
const form = document.getElementById("calculator");

const inputs = {
  itemCost:        document.getElementById("itemCost"),
  extraCosts:      document.getElementById("extraCosts"),
  shippingPaid:    document.getElementById("shippingPaid"),
  salePrice:       document.getElementById("salePrice"),
  shippingCharged: document.getElementById("shippingCharged"),
  feePercent:      document.getElementById("feePercent"),
  fixedFee:        document.getElementById("fixedFee"),
  currency:        document.getElementById("currency"),
};

const output = {
  profit:         document.getElementById("profit"),
  margin:         document.getElementById("margin"),
  roi:            document.getElementById("roi"),
  breakEven:      document.getElementById("breakEven"),
  verdict:        document.getElementById("verdict"),
  breakdownRows:  document.getElementById("breakdownRows"),
  compareRows:    document.getElementById("compareRows"),
};

// Every <span class="symbol" data-currency> on the page — all the € signs.
const currencySymbols = document.querySelectorAll("[data-currency]");

// Where the platform buttons will go, and the note underneath them.
const presetButtons = document.getElementById("presetButtons");
const presetNote = document.getElementById("presetNote");


/* --------------------------------------------------------------------------
   1b. THE PLATFORM DATA

   The fee numbers are NOT in this file. They live in fees.js, which is pure
   data with no logic in it. This file just borrows them.

   That split is deliberate. Fees change — often, and without warning. When
   they do, you edit one short data file and nothing else. You cannot break
   the calculator by updating a fee, because the two no longer live together.
   -------------------------------------------------------------------------- */
const platforms = FEE_DATA.platforms;


/* How old is this data? Dates in JavaScript are stored as milliseconds, so
   subtracting two of them gives milliseconds, and we divide down to days. */
function daysSinceChecked() {
  const checked = new Date(FEE_DATA.lastChecked);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today - checked) / msPerDay);
}

/* The site tells the truth about its own age, without anyone remembering to.
   Past 90 days it starts warning visitors; past 270 it stops vouching for
   the numbers at all. */
function reportDataAge() {
  const days = daysSinceChecked();
  const nice = new Date(FEE_DATA.lastChecked).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });

  document.getElementById("feeAge").textContent =
    "Platform fees last checked " + nice + " (" + days + " days ago).";

  const warning = document.getElementById("staleWarning");

  if (days > 270) {
    warning.textContent = "These fee figures are over nine months old. Check your platform's current rates before trusting them.";
    warning.className = "stale-warning is-bad";
  } else if (days > 90) {
    warning.textContent = "These fee figures are " + days + " days old. Worth double-checking against your platform.";
    warning.className = "stale-warning is-warn";
  } else {
    warning.textContent = "";
    warning.className = "stale-warning";
  }
}


/* --------------------------------------------------------------------------
   2. HELPERS
   -------------------------------------------------------------------------- */

/* An empty box gives us "" and Number("") is 0, which is fine.
   But Number("abc") gives NaN ("not a number"), which would poison every
   sum that touches it. So we check and fall back to 0. */
function readNumber(element) {
  const value = Number(element.value);
  return Number.isFinite(value) ? value : 0;
}

/* Turns 12.5 into "€12.50" using whichever currency is selected. */
function money(amount) {
  const symbol = inputs.currency.value;
  const sign = amount < 0 ? "-" : "";
  return sign + symbol + Math.abs(amount).toFixed(2);
}

/* Turns 0.325 into "32.5%" */
function percent(value) {
  return value.toFixed(1) + "%";
}


/* --------------------------------------------------------------------------
   3. THE MATHS

   This function does one job: take the numbers, return the answers.
   It does not touch the page at all. That separation is deliberate —
   it means you can change how things LOOK without any risk of breaking
   how things are CALCULATED, and the other way round.
   -------------------------------------------------------------------------- */
function profitFor(feePercent, fixedFee) {
  // What the buyer hands over in total
  const revenue = readNumber(inputs.salePrice) + readNumber(inputs.shippingCharged);

  // What you spent to get it sold
  const costs = readNumber(inputs.itemCost)
              + readNumber(inputs.extraCosts)
              + readNumber(inputs.shippingPaid);

  // The platform's cut. Most platforms charge their percentage on the
  // whole amount including postage, which is why we use `revenue` here.
  const feeRate      = feePercent / 100;
  const variableFee  = revenue * feeRate;
  const totalFees    = variableFee + fixedFee;

  const profit = revenue - costs - totalFees;

  // Margin: profit as a slice of what the buyer paid.
  // Guard against dividing by zero when every box is empty.
  const margin = revenue > 0 ? (profit / revenue) * 100 : null;

  // ROI: profit compared to the money you had to put in.
  const roi = costs > 0 ? (profit / costs) * 100 : null;

  // Break-even sale price — rearranging "profit = 0" to solve for sale price:
  //   (price + postageCharged) * (1 - feeRate) - fixedFee - costs = 0
  const breakEven = feeRate < 1
    ? (costs + fixedFee) / (1 - feeRate) - readNumber(inputs.shippingCharged)
    : null;

  return { revenue, costs, variableFee, fixedFee, totalFees, profit, margin, roi, breakEven };
}


/* The headline figures use whatever is typed in the fee boxes.
   One line, because profitFor() already does the work. */
function calculate() {
  return profitFor(readNumber(inputs.feePercent), readNumber(inputs.fixedFee));
}


/* --------------------------------------------------------------------------
   4. PUT THE RESULTS ON THE PAGE
   -------------------------------------------------------------------------- */
function render() {
  const r = calculate();

  // The big number
  output.profit.textContent = money(r.profit);
  // classList.toggle adds the class if the condition is true, removes it if false.
  output.profit.classList.toggle("is-loss", r.profit < 0);

  output.margin.textContent    = r.margin    === null ? "—" : percent(r.margin);
  output.roi.textContent       = r.roi       === null ? "—" : percent(r.roi);
  output.breakEven.textContent = r.breakEven === null ? "—" : money(Math.max(0, r.breakEven));

  output.verdict.textContent = verdictFor(r);

  renderBreakdown(r);
  renderComparison();
}

/* A plain-English sentence about the numbers. This is the bit that makes
   the tool useful rather than just arithmetic. */
function verdictFor(r) {
  if (r.revenue === 0) return "Fill in a sale price to see where you stand.";

  if (r.profit < 0) {
    // A fee of 100% or more swallows everything, so no price ever breaks even.
    if (r.breakEven === null) {
      return "At a fee of 100% or more, no sale price breaks even. Check the fee percentage.";
    }
    const needed = money(Math.max(0, r.breakEven));
    return "You would lose money on this one. You'd need to sell at " + needed + " just to break even.";
  }
  if (r.margin < 10) {
    return "Very thin. One return, one damaged item, or one postage price rise and this sale is gone.";
  }
  if (r.margin < 25) {
    return "Workable, but it only pays if you can do it in volume and nothing goes wrong.";
  }
  return "Healthy margin. There is room here to absorb a return or a bad listing.";
}

/* Builds the rows of the "show the full sum" table. */
function renderBreakdown(r) {
  const rows = [
    ["Buyer pays in total",          money(r.revenue)],
    ["Platform percentage fee",      "− " + money(r.variableFee)],
    ["Fixed fee",                    "− " + money(r.fixedFee)],
    ["Your costs (item, extras, postage)", "− " + money(r.costs)],
  ];

  // .map turns each row into a line of HTML, .join glues them together.
  let html = rows
    .map(function (row) {
      return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
    })
    .join("");

  html += "<tr class='total'><td>You keep</td><td>" + money(r.profit) + "</td></tr>";

  output.breakdownRows.innerHTML = html;
}


/* --------------------------------------------------------------------------
   4a. THE COMPARISON TABLE

   This is why profitFor() was worth separating out. The same item, run
   through every platform's fees at once, sorted best first. We did not
   rewrite the maths — we call the same function five times.
   -------------------------------------------------------------------------- */
function renderComparison() {
  // .map builds a new array: one { name, result } object per platform.
  const rows = platforms.map(function (platform) {
    return {
      name: platform.name,
      result: profitFor(platform.feePercent, platform.fixedFee)
    };
  });

  // .sort rearranges in place. Returning b minus a sorts highest first.
  rows.sort(function (a, b) {
    return b.result.profit - a.result.profit;
  });

  const bestProfit = rows[0].result.profit;

  output.compareRows.innerHTML = rows.map(function (row) {
    const r = row.result;

    // Ties are real — two fee-free platforms genuinely tie — so mark them all.
    const isBest = r.profit === bestProfit;

    // When every platform loses money, "best" is the wrong word for it.
    const badgeText = bestProfit > 0 ? "best" : "least bad";
    const label = isBest
      ? row.name + " <span class=\"badge\">" + badgeText + "</span>"
      : row.name;

    return "<tr class=\"" + (isBest ? "is-best" : "") + "\">"
         +   "<td>" + label + "</td>"
         +   "<td>" + money(r.totalFees) + "</td>"
         +   "<td>" + money(r.profit) + "</td>"
         +   "<td>" + (r.margin === null ? "—" : percent(r.margin)) + "</td>"
         + "</tr>";
  }).join("");
}


/* --------------------------------------------------------------------------
   4b. THE PLATFORM BUTTONS

   buildPresets() runs once, at startup. It loops over `platforms` and
   creates one button per entry. Because it loops, the list can be any
   length — one platform or fifty — and this code is unchanged.
   -------------------------------------------------------------------------- */
function buildPresets() {
  platforms.forEach(function (platform) {
    // createElement makes an element that does not exist in the HTML file.
    const button = document.createElement("button");

    // IMPORTANT: a <button> inside a <form> submits the form by default,
    // which reloads the page and wipes everything. type="button" stops that.
    button.type = "button";
    button.className = "preset";
    button.textContent = platform.name;

    // Each button remembers its own platform, because `platform` is still
    // in scope inside this function when the click happens later.
    button.addEventListener("click", function () {
      applyPreset(platform, button);
    });

    // Nothing appears on screen until we attach it to the page.
    presetButtons.appendChild(button);
  });
}

/* Fills the fee boxes from a platform and highlights its button. */
function applyPreset(platform, button) {
  inputs.feePercent.value = platform.feePercent;
  // toFixed(2) keeps it looking like money: "0.40", not "0.4".
  inputs.fixedFee.value = platform.fixedFee.toFixed(2);
  presetNote.textContent = platform.note;

  // Only one button should look selected, so clear them all, then set one.
  clearPresetHighlight();
  button.classList.add("is-active");

  // Changing a value in code does NOT fire the "input" event, so we have to
  // ask for a redraw ourselves. A common thing to get caught by.
  render();
}

/* Used when the user types their own fee — the preset no longer applies. */
function clearPresetHighlight() {
  document.querySelectorAll(".preset").forEach(function (b) {
    b.classList.remove("is-active");
  });
}


/* --------------------------------------------------------------------------
   5. LISTEN FOR CHANGES

   "input" fires on every keystroke, so results update live as you type.
   We listen on the whole form rather than on each box — events bubble up
   from the input to its parents, so one listener catches them all.
   -------------------------------------------------------------------------- */
form.addEventListener("input", function (event) {
  // event.target is the exact element that changed. If the user has typed
  // their own fee, the highlighted preset is no longer true.
  if (event.target === inputs.feePercent || event.target === inputs.fixedFee) {
    clearPresetHighlight();
    presetNote.textContent = "";
  }
  updateCurrencySymbols();
  render();
});

/* Pressing Enter in a form submits it, which reloads the page and loses
   everything typed. There is nowhere to submit to, so we block it. */
form.addEventListener("submit", function (event) {
  event.preventDefault();
});

/* Keeps every € sign on the page matching the dropdown. */
function updateCurrencySymbols() {
  currencySymbols.forEach(function (span) {
    span.textContent = inputs.currency.value;
  });
}

// Run once on load: check how old the fee data is, make the buttons,
// then draw the first set of results.
reportDataAge();
buildPresets();
render();
