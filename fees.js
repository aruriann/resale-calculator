

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
