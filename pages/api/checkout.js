// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import getBackupModel from "@/lib/backupModel";
import { logAction } from "@/lib/monitoringLogger";

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
      (input || "")
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
    if (!plate_config || !customer) {
      const errorResponse = { error: "Missing required fields" };
      await logAction({
        endpoint: "/api/checkout",
        actionName: "Checkout Failed (Missing required fields)",
        statusCode: 400,
        requestData: req.body,
        responseData: errorResponse,
        error: "Missing required fields",
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);
      return res.status(400).json(errorResponse);
    }
    const { fQuantity = 0, rQuantity = 0 } = plate_config;
    
    const Backup = getBackupModel();

    const bodys = req.body;
    const backup = await Backup.create(bodys);
    const orderCode = `PNPM-${backup._id.toString().slice(-5).toUpperCase()}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      await resend.emails.send({
        from: "Order <onboarding@resend.dev>",
        to: "order.pnpm@gmail.com",
        subject: `Order recieved from ${customer.firstName || 'Customer'} (${orderCode})`,
        html: `<div>
    <h1>Order Details (${orderCode})</h1><br />
    <h2>Customer Details</h2><br />
    <b>First Name:</b> ${customer.firstName || ''}<br />
    <b>Last Name:</b> ${customer.lastName || ''}<br />
    <b>Email Address:</b> ${customer.email || ''}<br />
    <b>Phone Number:</b> ${customer.phone || ''}<br />
    <b>Address 1:</b> ${customer.address1 || ''}<br />
    <b>Address 2:</b> ${customer.address2 || ''}<br />
    <b>City:</b> ${customer.city || ''}<br />
    <b>Postcode:</b> ${customer.postcode || ''}<br />
    <b>Payment Method:</b> ${paymentMethod || 'stripe'}<br />
    ${body.paymentIntentId ? `<b>Stripe Payment Ref:</b> ${body.paymentIntentId}<br />` : ""}
    <br />
      <hr />
    <h2>Product Details</h2>

    <b>Plate Type:</b> ${formatLabel(plate_config.plate_type)}<br />
    <b>Registration Text:</b> ${plate_config.text?.toUpperCase() || ''}<br />
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
      plate_config.freeKit?.screws
        ? "Screw Fixing Kit with Caps"
        : "Pack of 10 Sticky Pads"
    }
    <br />
    <b>Accessories:</b>
    ${
      Array.isArray(plate_config.accessories) && plate_config.accessories.length > 0
        ? plate_config.accessories.map((a) => formatLabel(a)).join(", ")
        : "None"
    }
    <br />

    <hr />

    <h2>Pricing</h2>
    <b>Total Price:</b> £${plate_config.total}<br />
    </div>`,
      });
    } catch (staffMailError) {
      console.error("Staff notification email failed:", staffMailError?.message);
    }

    try {
      await axios.post(
        `${process.env.BACKEND_URL}/api/document-mail`,
        { ...req.body, orderCode },
      );
    } catch (docMailError) {
      console.error("Document-mail trigger failed:", docMailError?.message);
    }

    const backupObj = backup.toObject ? backup.toObject() : backup;
    const successResponse = {
      success: true,
      order: {
        ...backupObj,
        _id: backup._id,
        id: backup._id.toString(),
        number: orderCode,
        orderNumber: orderCode,
      },
      orderCode,
    };

    await logAction({
      endpoint: "/api/checkout",
      actionName: `Order Created & Saved: ${customer?.firstName || ''} ${customer?.lastName || ''} (${plate_config?.text || 'REG'}) [${orderCode}]`,
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
      stack: error.stack,
    });

    const errorMessage = error?.message || "Order creation failed";
    const statusCode = error?.status || 500;

    const errorResponse = {
      error: errorMessage,
      details: error?.message,
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