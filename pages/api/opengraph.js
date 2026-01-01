// pages/api/opengraph.js
export default async function handler(req, res) {
  const { product_id, plate_type } = req.query;

  // Example dynamic OG data
  const ogTitle = plate_type ? `${plate_type} Custom Plate` : 'Custom Plate';
  const ogDescription = `Order your ${plate_type || 'custom'} license plate online.`;
  const ogImage = `${process.env.WP_URL}/default-plate-image.png`; // can replace with actual preview image if available

  return res.status(200).json({
    "og:title": ogTitle,
    "og:description": ogDescription,
    "og:image": ogImage,
    "og:type": "product"
  });
}
