// pages/api/structured-data.js
export default async function handler(req, res) {
  const { product_id, plate_type, price = 24.95, currency = "GBP" } = req.query;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": `${plate_type || "Custom"} License Plate`,
    "image": [`${process.env.WP_URL}/default-plate-image.png`],
    "description": `Order your ${plate_type || "custom"} license plate online.`,
    "offers": {
      "@type": "Offer",
      "url": `${process.env.WP_URL}/product/${product_id || "custom-plate"}`,
      "priceCurrency": currency,
      "price": price,
      "availability": "https://schema.org/InStock"
    }
  };

  return res.status(200).json(jsonLd);
}
