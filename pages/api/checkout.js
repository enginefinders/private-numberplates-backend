// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import getBackupModel from "@/lib/backupModel";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ CONNECT DB
    await connectDB();

    const body = req.body;
    const { customer, plate_config, quantity, paymentMethod } = body;

    if (!customer || !plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

      // ✅ SAVE BACKUP (DIRECT SAVE)
     const Backup = getBackupModel(); // ✅ always get the model safely

  const bodys = req.body;
  const backup = await Backup.create(bodys);
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
          if(paymentMethod)
      meta_data.push({key: "Payment Method", value: paymentMethod});

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
  <b>Payment Method:</b> ${paymentMethod}<br />
  <br />
  <h2>Product Details</h2>
    <b>Plate Type:</b> ${plate_config.plate_type}<br />
  <b>Text:</b> ${plate_config.text}<br />
  <b>Plate Size:</b> ${plate_config.plate_size}<br />
  ${plate_config.hexPlate ? (`<b>Hex Plate:</b> ${plate_config.hexPlate && "Selected"} <br />`) : (" ")}
  <b>Legality:</b> ${plate_config.legal_type}<br />
  <b>Sides:</b> ${plate_config.sides}<br />
  ${plate_config.border.borderSelected ? (`<b>Border:</b> ${plate_config.border.borderSelected && "Selected Black"}<br />`) : (" ")}
  <b>Free Kit:</b> ${plate_config.freeKit.pads ? "Sticky pad x6" : "Self Taping Screws with Screw Caps"}<br />
  </div>`
});
 const endpoint = `${process.env.WP_URL}/wp-json/wc/v3/orders`;
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
