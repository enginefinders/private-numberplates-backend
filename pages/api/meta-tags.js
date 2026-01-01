// pages/api/meta-tags.js
export default async function handler(req, res) {
  const { product_id, plate_type } = req.query;

  // Dummy dynamic data
  const title = plate_type ? `${plate_type} Custom Plate` : 'Custom Plate';
  const description = `Order your ${plate_type || 'custom'} license plate online.`;

  return res.status(200).json({
    title,
    description,
    keywords: "license plate, custom plate, 3D plate, 4D plate, 5D plate, Ghost plate, UK plates"
  });
}
