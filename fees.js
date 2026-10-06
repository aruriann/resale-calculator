/* ==========================================================================
   fees.js — the platform fee data, and nothing else.

   This file is DATA. No logic lives here, and no fee numbers live anywhere
   else. When a platform changes its rates, this is the only file you touch,
   and you can edit it without being able to read a line of JavaScript.

   WHEN YOU UPDATE A FEE: change the number, AND change lastChecked to
   today's date. The site reads that date and tells visitors how old these
   numbers are. A stale figure that claims to be current is worse than no
   figure at all.

   Date format is YYYY-MM-DD. Always.
   ========================================================================== */

const FEE_DATA = {

  lastChecked: "2026-10-06",

  platforms: [
    {
      name: "eBay",
      feePercent: 13.6,
      fixedFee: 0.40,
      note: "13.6% final value fee, charged on the total including postage, plus a fixed fee per order. Your category or shop subscription can change this.",
      source: "https://www.ebay.com/help/selling/fees-credits-invoices/selling-fees"
    },
    {
      name: "Vinted",
      feePercent: 0,
      fixedFee: 0,
      note: "Sellers pay nothing. The Buyer Protection fee is added on the buyer's side, so it never comes out of your money.",
      source: "https://www.vinted.co.uk/help"
    },
    {
      name: "Etsy",
      feePercent: 10.5,
      fixedFee: 0.50,
      note: "6.5% transaction fee plus payment processing of roughly 4%, and a listing fee. Processing rates vary by country.",
      source: "https://www.etsy.com/legal/fees/"
    },
    {
      name: "Depop",
      feePercent: 3.3,
      fixedFee: 0.45,
      note: "3.3% plus a fixed payment processing fee.",
      source: "https://www.depop.com/terms/"
    },
    {
      name: "Cash / local",
      feePercent: 0,
      fixedFee: 0,
      note: "No platform, no fees. Just your costs against the price you agreed.",
      source: ""
    }
  ]
};
