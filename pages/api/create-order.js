// pages/api/create-order.js
import axios from 'axios';

const WP_URL = (process.env.WP_URL || '').replace(/\/$/, '');
const WC_AUTH = { username: process.env.WC_KEY, password: process.env.WC_SECRET };
console.log('WP_URL is:', WP_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product_id, quantity = 1, plate_config, preview_base64, customer_email } = req.body;

  if (!product_id || !plate_config) {
    return res.status(400).json({ error: 'Missing product_id or plate_config' });
  }

  try {
    // Customer-friendly order meta
    const meta_data = [
      { key: 'Plate Type', value: plate_config.plate_type },
      { key: 'Size', value: plate_config.size },
      { key: 'Sides', value: plate_config.sides },
      { key: 'Text', value: plate_config.text },
      { key: 'Font', value: plate_config.font },
      { key: 'Legal Type', value: plate_config.legal_type || 'road_legal' },
      { key: 'Base Price', value: plate_config.pricing_breakdown?.base ?? 0 },
      { key: '3D Gel', value: plate_config.pricing_breakdown?.gel3d ?? 0 },
      { key: '4D Raised', value: plate_config.pricing_breakdown?.raised4d ?? 0 },
      { key: 'Total Price', value: plate_config.total ?? 0 }
    ];

    // Keep hidden JSON for dev/debugging (prefix with _ so Woo hides it on frontend)
    meta_data.push({ key: '_plate_config_raw', value: JSON.stringify(plate_config) });
    meta_data.push({ key: '_pricing_breakdown_raw', value: JSON.stringify(plate_config.pricing_breakdown || {}) });

    if (preview_base64) {
      meta_data.push({ key: '_plate_preview_base64', value: preview_base64 });
    }

    // Ensure final price is included
    const itemTotal = plate_config.total ? Number(plate_config.total).toFixed(2) : "0.00";

    // Build order object
    const orderBody = {
     payment_method: 'stripe',
payment_method_title: 'Stripe',
set_paid: false,
      billing: { email: customer_email || 'guest@example.com' },
      line_items: [
        {
          product_id: Number(product_id),
          quantity: Number(quantity),
          total: itemTotal, // explicitly override WooCommerce price
          meta_data
        }
      ]
    };

    // Create order via WooCommerce REST API
    const { data: order } = await axios.post(`${WP_URL}/wp-json/wc/v3/orders`, orderBody, {
      auth: WC_AUTH,
      headers: { 'Content-Type': 'application/json' }
    });

    // Use WooCommerce order-pay endpoint
    const payUrl = `${WP_URL}/checkout-2/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

    return res.status(200).json({
      placed: true,
      status_text: "Order created",
      order,
      payUrl
    });
  } catch (err) {
    console.error('create-order error:', err.response?.data || err.message);
    return res.status(500).json({
      placed: false,
      status_text: "Order not created",
      error: "Failed to create order",
      details: err.response?.data || err.message
    });
  }
}
