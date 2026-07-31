// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import getBackupModel from "@/lib/backupModel";

async function callWCAPIWithRetry(endpoint, orderData, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(endpoint, orderData, {
        auth: {
          username: process.env.WC_KEY,
          password: process.env.WC_SECRET,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      lastError = error;

      console.error(`WC API attempt ${attempt + 1} failed:`, {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      // Don't retry auth/client errors
      if (error?.response?.status && error.response.status < 500) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); 
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const formatLabel = (input) => {
    return (
      input
        .trim()
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((word) => {
          if (/^[a-zA-Z]/.test(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          return word;
        })
        .join(" ")
    );
  };
  try {
    await connectDB();

    const body = req.body;
    const { customer, plate_config, paymentMethod } = body;
    if (!plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const {fQuantity, rQuantity} = plate_config;
    
    const Backup = getBackupModel();

    const bodys = req.body;
    const backup = await Backup.create(bodys);
    const meta_data = [];

    if (plate_config.plate_type)
      meta_data.push({
        key: "Plate Type",
        value: formatLabel(plate_config.plate_type),
      });
    if (plate_config.text)
      meta_data.push({
        key: "Reg Number",
        value: formatLabel(plate_config.text.toUpperCase()),
      });

    if (plate_config.sides)
      meta_data.push({ key: "Sides", value: formatLabel(plate_config.sides) });
    if (plate_config.legal_type)
      meta_data.push({
        key: "Legality",
        value: formatLabel(plate_config.legal_type),
      });
if (fQuantity > 0) {
  meta_data.push({
    key: "Front Quantity",
    value: String(fQuantity),
  });
}

if (rQuantity > 0) {
  meta_data.push({
    key: "Rear Quantity",
    value: String(rQuantity),
  });
}
    if (plate_config.hexPlate)
      meta_data.push({ key: "Hex Plate", value: "Yes" });
    if (plate_config.badge)
      meta_data.push({ key: "Badge", value: plate_config.badge });
    if (plate_config.border.borderSelected)
      meta_data.push({ key: "Border", value: "Black" });
    if (plate_config.sides === "both") {
      meta_data.push({ key: "Front Plate Size", value: plate_config.front_plate_size });
      meta_data.push({ key: "Rear Plate Size", value: plate_config.rear_plate_size });
    } else {
      meta_data.push({ key: "Plate Size", value: (plate_config.sides === "front" ? plate_config.front_plate_size : plate_config.rear_plate_size) });
    }
if (plate_config.freeKit?.pads)
  meta_data.push({
    key: "Free Kit Pads",
    value: "Sticky Pads x6",
  });

if (plate_config.freeKit?.screws)
  meta_data.push({
    key: "Free Kit Screws",
    value: "Self Taping Screws With Screw Caps",
  });
    if (paymentMethod)
      meta_data.push({
        key: "Payment Method",
        value: formatLabel(paymentMethod),
      });

    if (plate_config.total != null) {
      meta_data.push({
  key: "Total Price",
  value: String(plate_config.total),
});
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Order <onboarding@resend.dev>",
      to: "order.pnpm@gmail.com",
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
    <hr />
  <h2>Product Details</h2>

  <b>Plate Type:</b> ${formatLabel(plate_config.plate_type)}<br />
  <b>Registration Text:</b> ${plate_config.text?.toUpperCase()}<br />
  ${plate_config.sides === "both"
  ? `
    <b>Front Plate Size:</b> ${formatLabel(plate_config.front_plate_size)}<br />
    <b>Rear Plate Size:</b> ${formatLabel(plate_config.rear_plate_size)}<br />
  `
  : `
    <b>Plate Size:</b> ${formatLabel(plate_config.sides === "front" ? plate_config.front_plate_size : plate_config.rear_plate_size)}<br />
  `
}
  <b>Legality:</b> ${formatLabel(plate_config.legal_type)}<br />
  <b>Sides:</b> ${formatLabel(plate_config.sides)}<br />
${fQuantity > 0 ? `<b>Front Quantity:</b> ${fQuantity}<br />` : ''}
${rQuantity > 0 ? `<b>Rear Quantity:</b> ${rQuantity}<br />` : ''}
  <b>Hex Plate:</b> ${plate_config.hexPlate ? "Yes" : "No"}<br />
  <b>Badge:</b> ${plate_config.badge || "None"}<br />
  <b>Border:</b> ${
    plate_config.border?.borderSelected ? "Black Border Selected" : "None"
  }<br />

  <b>Free Kit:</b>
  ${
    plate_config.freeKit?.pads
      ? "Sticky Pads x6"
      : plate_config.freeKit?.screws
      ? "Self Tapping Screws with Caps"
      : "None"
  }
  <br />

  <hr />

  <h2>Pricing</h2>
  <b>Total Price:</b> £${plate_config.total}<br />
  </div>`,
    });

    const phoneDigitsOnly = String(customer.phone || "").replace(/\D/g, "");



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
        phone: phoneDigitsOnly,
        address_1: customer.address1,
        address_2: customer.address2 || "",
        city: customer.city,
        postcode: customer.postcode,
        country: customer.country,
      },
      line_items: [
        {
          product_id: Number(process.env.CUSTOM_PLATE_PRODUCT_ID),
          quantity: fQuantity + rQuantity,
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

    // const response = await axios.post(endpoint, orderData, {
    //   auth: {
    //     username: process.env.WC_KEY,
    //     password: process.env.WC_SECRET,
    //   },
    // });
const response = await callWCAPIWithRetry(endpoint, orderData);

try {
  await axios.post(
    `${process.env.BACKEND_URL}/api/document-mail`,
    { ...req.body },
  );
} catch (docMailError) {
  console.error("Document-mail trigger failed:", docMailError?.message);
}


return res.status(200).json({
  success: true,
  order: response,
});
  } catch (error) {
  console.error("Checkout error:", {
    message: error.message,
    status: error?.response?.status,
    data: error?.response?.data,
    code: error.code,
  });

  let errorMessage = "Checkout failed";
  let statusCode = 500;

  if (error?.response?.status === 401 || error?.response?.status === 403) {
    errorMessage = "Authentication error with WooCommerce";
    statusCode = 401;
  } else if (error?.response?.status === 400) {
    errorMessage =
      error?.response?.data?.message || "Invalid order data";
    statusCode = 400;
  } else if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    errorMessage =
      "WooCommerce timeout - please try again";
    statusCode = 504;
  } else if (error?.response?.status >= 500) {
    errorMessage =
      "WooCommerce temporarily unavailable";
    statusCode = 503;
  }

  return res.status(statusCode).json({
    error: errorMessage,
    details: error?.response?.data || error.message,
  });
}
}
