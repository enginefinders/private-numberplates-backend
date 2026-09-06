// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import getBackupModel from "@/lib/backupModel";
import { logAction } from "@/lib/monitoringLogger";

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
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); 
  }
  if (req.method !== "POST") {
    const errorResponse = { error: "Method not allowed" };
    await logAction({
      endpoint: "/api/checkout",
      actionName: "Checkout Rejected (Method Not Allowed)",
      statusCode: 405,
      requestData: req.body,
      responseData: errorResponse,
      error: "Method not allowed",
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);
    return res.status(405).json(errorResponse);
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
    const { customer, plate_config, paymentMethod } = body || {};
    if (!plate_config) {
      const errorResponse = { error: "Missing required fields" };
      await logAction({
        endpoint: "/api/checkout",
        actionName: "Checkout Failed (Missing plate_config)",
        statusCode: 400,
        requestData: req.body,
        responseData: errorResponse,
        error: "Missing required fields",
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);
      return res.status(400).json(errorResponse);
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

    // Free Kit / Extras & Accessories Metadata
    if (plate_config.freeKit?.pads)
      meta_data.push({
        key: "Free Kit Pads",
        value: "Pack of 10 Sticky Pads",
      });
    if (plate_config.freeKit?.screws)
      meta_data.push({
        key: "Free Kit Screws",
        value: "Screw Fixing Kit with Caps",
      });
    if (plate_config.freeKit?.velcro)
      meta_data.push({
        key: "Free Kit Velcro",
        value: "Velcro Plate Holders",
      });
    if (plate_config.freeKit?.magnetic)
      meta_data.push({
        key: "Free Kit Magnetic",
        value: "Magnetic Screw-On Holders",
      });
    if (plate_config.freeKit?.airFreshener)
      meta_data.push({
        key: "Free Kit Air Freshener",
        value: "TurboJet Air Freshener",
      });
    if (plate_config.freeKit?.audiClips)
      meta_data.push({
        key: "Free Kit Audi Clips",
        value: "Audi Honeycomb Grille Plate Holder Clips",
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
      ? "Pack of 10 Sticky Pads"
      : plate_config.freeKit?.screws
      ? "Screw Fixing Kit with Caps"
      : plate_config.freeKit?.velcro
      ? "Velcro Plate Holders"
      : plate_config.freeKit?.magnetic
      ? "Magnetic Screw-On Holders"
      : plate_config.freeKit?.airFreshener
      ? "TurboJet Air Freshener"
      : plate_config.freeKit?.audiClips
      ? "Audi Honeycomb Grille Plate Holder Clips"
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

    const response = await callWCAPIWithRetry(endpoint, orderData);

    try {
      await axios.post(
        `${process.env.BACKEND_URL}/api/document-mail`,
        { ...req.body },
      );
    } catch (docMailError) {
      console.error("Document-mail trigger failed:", docMailError?.message);
    }

    const successResponse = {
      success: true,
      order: response,
    };

    await logAction({
      endpoint: "/api/checkout",
      actionName: `Order Created & Ingested: ${customer?.firstName || ''} ${customer?.lastName || ''} (${plate_config?.text || 'REG'})`,
      statusCode: 200,
      requestData: req.body,
      responseData: successResponse,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(successResponse);
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

    const errorResponse = {
      error: errorMessage,
      details: error?.response?.data || error.message,
    };

    await logAction({
      endpoint: "/api/checkout",
      actionName: `Checkout Failed (${statusCode})`,
      statusCode,
      requestData: req.body,
      responseData: errorResponse,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(statusCode).json(errorResponse);
  }
}