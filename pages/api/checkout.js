// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import Backup from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ CONNECT DB
    await connectDB();

    const body = req.body;
    const { customer, plate_config, quantity } = body;

    if (!customer || !plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ SAVE BACKUP (DIRECT SAVE)
    await Backup.create(body);

    // ---------------- EMAIL ----------------
    const meta_data = [];

    if (plate_config.text)
      meta_data.push({ key: "Text", value: plate_config.text });

    if (plate_config.plate_type)
      meta_data.push({ key: "Plate Type", value: plate_config.plate_type });

    if (plate_config.sides)
      meta_data.push({ key: "Sides", value: plate_config.sides });

    if (plate_config.hexPlate)
      meta_data.push({ key: "Hex Plate", value: "Yes" });

    if (plate_config.freeKit?.pads)
      meta_data.push({ key: "Free Kit", value: "Sticky Pads x6" });

    if (plate_config.freeKit?.screws)
      meta_data.push({
        key: "Free Kit",
        value: "Self Taping Screws With Screw Caps",
      });

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Order <onboarding@resend.dev>",
      to: "order.pnpm@gmail.com",
      subject: `Order received from ${customer.firstName}`,
      html: `<pre>${JSON.stringify(meta_data, null, 2)}</pre>`,
    });

    // ---------------- WOOCOMMERCE ----------------
    const endpoint = `${process.env.WP_URL}/wp-json/wc/v3/orders`;

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
        postcode: customer.postcode,
        country: customer.country,
      },
      line_items: [
        {
          product_id: Number(process.env.CUSTOM_PLATE_PRODUCT_ID),
          quantity: Number(quantity),
          meta_data,
        },
      ],
      fee_lines: [
        {
          name: "Custom Plate Price",
          total: String(plate_config.total),
        },
      ],
    };

    const response = await axios.post(endpoint, orderData, {
      auth: {
        username: process.env.WC_KEY,
        password: process.env.WC_SECRET,
      },
    });

    return res.status(200).json({
      success: true,
      order: response.data,
    });
  } catch (error) {
    console.error("Checkout error:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Checkout failed",
      details: error.response?.data || error.message,
    });
  }
}
