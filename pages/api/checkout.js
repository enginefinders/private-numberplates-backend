// pages/api/checkout.js
import axios from "axios";
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customer, plate_config, quantity } = req.body;

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
    const meta_data = [];

// Always present
if (plate_config.text) {
  meta_data.push({ key: "Text", value: plate_config.text });
}

if (plate_config.plate_type) {
  meta_data.push({ key: "Plate Type", value: plate_config.plate_type });
}

if (plate_config.size) {
  meta_data.push({ key: "Size", value: plate_config.size });
}

// Optional / conditional
if (plate_config.hexPlate === true) {
  meta_data.push({ key: "Hex Plate", value: "Yes" });
}

if (plate_config.sides) {
  meta_data.push({ key: "Sides", value: plate_config.sides });
}

if (plate_config.badge?.type && plate_config.badge.type !== "none") {
  meta_data.push({ key: "Badge", value: plate_config.badge.type });
}

if (plate_config.border?.borderSelected === true) {
  meta_data.push({
    key: "Border",
    value: plate_config.border.borderColor,
  });
}

if (plate_config.legal_type) {
  meta_data.push({ key: "Legal Type", value: plate_config.legal_type });
}

// Free kit logic (fixed bug here)
if (plate_config.freeKit?.pads === true) {
  meta_data.push({ key: "Free Kit", value: "Sticky Pads x6" });
}

if (plate_config.freeKit?.screws === true) {
  meta_data.push({
    key: "Free Kit",
    value: "Self Taping Screws With Screw Caps",
  });
}

// Pricing (always useful)
if (plate_config.total != null) {
  meta_data.push({ key: "Total Price", value: plate_config.total });
}
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Order <onboarding@resend.dev>',
  to: 'order.pnpm@gmail.com',
  subject: `Order recieved from ${customer.firstName}`,
  html: `<div>
  <h1>Order Details</h1><br />
  <h2>Customer Details</h2><br />
  <b>First Name:</b> ${customer.firstName}<br />
  <b>Last Name:</b> ${customer.lastName}<br />
  <b>Email Address:</b> ${customer.email}<br />
  <b>Phone Number:</b> ${customer.phone}<br />
  <b>Address 1:</b> ${customer.address1}<br />
  <b>Address 2:</b> ${customer.address2}<br />
  <b>City:</b> ${customer.city}<br />
  <b>Postcode:</b> ${customer.postcode}<br />
  <br />
  <h2>Number Plate Details</h2>
    <b>Plate Type:</b> ${plate_config.plate_type}<br />
  <b>Text:</b> ${plate_config.text}<br />
  <b>Plate Size:</b> ${plate_config.plate_size}<br />
  ${plate_config.hexPlate ? (`<b>Hex Plate:</b> ${plate_config.hexPlate && "Selected"} <br />`) : ("<br />")}
  <b>Legality:</b> ${plate_config.legal_type}<br />
  <b>Sides:</b> ${plate_config.sides}<br />
  ${plate_config.border.borderSelected ? (`<b>Border:</b> ${plate_config.border.borderSelected && "Selected Black"}<br />`) : ("<br />")}
  <b>Free Kit:</b> ${plate_config.freeKit.pads ? "Sticky pad x6" : "Self Taping Screws with Screw Caps"}<br />
  </div>`
});

    // Prepare WooCommerce order data
    const orderData = {
      payment_method: "stripe",
      payment_method_title: "Stripe",
      set_paid: true,
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
    quantity: Number(quantity),
    meta_data
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
