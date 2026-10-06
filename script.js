
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


const currencySymbols = document.querySelectorAll("[data-currency]");


const presetButtons = document.getElementById("presetButtons");
const presetNote = document.getElementById("presetNote");



const platforms = FEE_DATA.platforms;



function daysSinceChecked() {
  const checked = new Date(FEE_DATA.lastChecked);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today - checked) / msPerDay);
}


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



function readNumber(element) {
  const value = Number(element.value);
  return Number.isFinite(value) ? value : 0;
}

function money(amount) {
  const symbol = inputs.currency.value;
  const sign = amount < 0 ? "-" : "";
  return sign + symbol + Math.abs(amount).toFixed(2);
}


function percent(value) {
  return value.toFixed(1) + "%";
}



function profitFor(feePercent, fixedFee) {
  
  const revenue = readNumber(inputs.salePrice) + readNumber(inputs.shippingCharged);

  // What you spent to get it sold
  const costs = readNumber(inputs.itemCost)
              + readNumber(inputs.extraCosts)
              + readNumber(inputs.shippingPaid);


  const feeRate      = feePercent / 100;
  const variableFee  = revenue * feeRate;
  const totalFees    = variableFee + fixedFee;

  const profit = revenue - costs - totalFees;

  
  const margin = revenue > 0 ? (profit / revenue) * 100 : null;

 
  const roi = costs > 0 ? (profit / costs) * 100 : null;

  
  const breakEven = feeRate < 1
    ? (costs + fixedFee) / (1 - feeRate) - readNumber(inputs.shippingCharged)
    : null;

  return { revenue, costs, variableFee, fixedFee, totalFees, profit, margin, roi, breakEven };
}



function calculate() {
  return profitFor(readNumber(inputs.feePercent), readNumber(inputs.fixedFee));
}



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


function verdictFor(r) {
  if (r.revenue === 0) return "Fill in a sale price to see where you stand.";

  if (r.profit < 0) {
    
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


function renderBreakdown(r) {
  const rows = [
    ["Buyer pays in total",          money(r.revenue)],
    ["Platform percentage fee",      "− " + money(r.variableFee)],
    ["Fixed fee",                    "− " + money(r.fixedFee)],
    ["Your costs (item, extras, postage)", "− " + money(r.costs)],
  ];

  let html = rows
    .map(function (row) {
      return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
    })
    .join("");

  html += "<tr class='total'><td>You keep</td><td>" + money(r.profit) + "</td></tr>";

  output.breakdownRows.innerHTML = html;
}



function renderComparison() {
  
  const rows = platforms.map(function (platform) {
    return {
      name: platform.name,
      result: profitFor(platform.feePercent, platform.fixedFee)
    };
  });


  rows.sort(function (a, b) {
    return b.result.profit - a.result.profit;
  });

  const bestProfit = rows[0].result.profit;

  output.compareRows.innerHTML = rows.map(function (row) {
    const r = row.result;

   
    const isBest = r.profit === bestProfit;

  
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



function buildPresets() {
  platforms.forEach(function (platform) {
  
    const button = document.createElement("button");

   
    button.type = "button";
    button.className = "preset";
    button.textContent = platform.name;

    
    button.addEventListener("click", function () {
      applyPreset(platform, button);
    });

    
    presetButtons.appendChild(button);
  });
}


function applyPreset(platform, button) {
  inputs.feePercent.value = platform.feePercent;
  
  inputs.fixedFee.value = platform.fixedFee.toFixed(2);
  presetNote.textContent = platform.note;


  clearPresetHighlight();
  button.classList.add("is-active");


  render();
}


function clearPresetHighlight() {
  document.querySelectorAll(".preset").forEach(function (b) {
    b.classList.remove("is-active");
  });
}



form.addEventListener("input", function (event) {

  if (event.target === inputs.feePercent || event.target === inputs.fixedFee) {
    clearPresetHighlight();
    presetNote.textContent = "";
  }
  updateCurrencySymbols();
  render();
});


form.addEventListener("submit", function (event) {
  event.preventDefault();
});


function updateCurrencySymbols() {
  currencySymbols.forEach(function (span) {
    span.textContent = inputs.currency.value;
  });
}


reportDataAge();
buildPresets();
render();
