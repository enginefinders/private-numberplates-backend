// pages/api/checkout.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customer, plate_config } = req.body;

    if (!customer || !plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Load from .env
    const WC_KEY = process.env.WC_KEY;
    const WC_SECRET = process.env.WC_SECRET;
    const WP_URL = process.env.WP_URL;
    const CUSTOM_PLATE_PRODUCT_ID = process.env.CUSTOM_PLATE_PRODUCT_ID;

    // WooCommerce REST API endpoint
    const endpoint = `${WP_URL}/wp-json/wc/v3/orders`;
const wordpress_display = [
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
    // Prepare WooCommerce order data
    const orderData = {
      payment_method: "cod",
      payment_method_title: "Cash on delivery",
      set_paid: false,
      billing: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: String(customer.phone),
        address_1: customer.address1,
        address_2: customer.address2 || "",
        city: customer.city,
        state: customer.state,
        postcode: customer.postcode,
        country: customer.country,
      },
      shipping: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address1,
        address_2: customer.address2 || "",
        city: customer.city,
        state: customer.state,
        postcode: customer.postcode,
        country: customer.country,
      },
    line_items: [
  {
    product_id: parseInt(CUSTOM_PLATE_PRODUCT_ID, 10),
    quantity: 1,
    meta_data: [
      {
        key: "Order Details",
        value: JSON.stringify(wordpress_display),
      },
    ],
  },
],
fee_lines: [
  {
    name: "Custom Plate Price",
    total: String(plate_config.total), 
  },
],


    };

    // Push order to WooCommerce
    const response = await axios.post(endpoint, orderData, {
      auth: {
        username: WC_KEY,
        password: WC_SECRET,
      },
    });

    return res.status(200).json({
      success: true,
      order: response.data,
    });
  } catch (error) {
    console.error("WooCommerce order error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to create WooCommerce order",
      details: error.response?.data || error.message,
    });
  }
}
