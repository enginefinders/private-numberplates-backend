// pages/api/addleadtodb.js
import connectDB from "@/lib/mongodb";
import getLeadsModel from "@/lib/leadModel";
import { Resend } from "resend";
import { logAction } from "@/lib/monitoringLogger";

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); 
  }
  if (req.method !== "POST") {
    const errorResponse = { error: "Method not allowed" };
    await logAction({
      endpoint: "/api/addleadtodb",
      actionName: "Lead Capture Rejected (Method Not Allowed)",
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
    // ✅ CONNECT DB
    await connectDB();

    const body = req.body;
    const { customer, plate_config, Fquantity, Rquantity } = body || {};

    if (!plate_config) {
      const errorResponse = { error: "Missing required fields" };
      await logAction({
        endpoint: "/api/addleadtodb",
        actionName: "Lead Capture Failed (Missing plate_config)",
        statusCode: 400,
        requestData: req.body,
        responseData: errorResponse,
        error: "Missing required fields in body",
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);
      return res.status(400).json(errorResponse);
    }

    const resend = new Resend(process.env.RESEND_API_KEY2 || process.env.RESEND_API_KEY);
    let mailConfirmation = null;
    try {
      mailConfirmation = await resend.emails.send({
        from: "Lead <onboarding@resend.dev>",
        to: "pnpm.leads@gmail.com",
        subject: `Order recieved from ${customer?.firstName || 'Customer'}`,
        html: `<div>
    <h1>Order Details</h1><br />
    <h2>Customer Details</h2><br />
    <b>First Name:</b> ${customer?.firstName}<br />
    <b>Last Name:</b> ${customer?.lastName}<br />
    <b>Email Address:</b> ${customer?.email}<br />
    <b>Phone Number:</b> ${customer?.phone}<br />
    <b>Address 1:</b> ${customer?.address1}<br />
    <b>Address 2:</b> ${customer?.address2}<br />
    <b>City:</b> ${customer?.city}<br />
    <b>Postcode:</b> ${customer?.postcode}<br />
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
  ${Fquantity > 0 ? `<b>Front Quantity:</b> ${Fquantity}<br />` : ''}
  ${Rquantity > 0 ? `<b>Rear Quantity:</b> ${Rquantity}<br />` : ''}

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
    } catch (mailErr) {
      console.warn("Lead email notification failed non-blockingly:", mailErr.message);
    }

    // ✅ SAVE BACKUP (DIRECT SAVE)
    const lead = getLeadsModel();
    const makeALead = await lead.create(req.body);

    const successResponse = {
      success: true,
      leadId: makeALead?._id,
      mail: mailConfirmation,
    };

    await logAction({
      endpoint: "/api/addleadtodb",
      actionName: `Lead Captured: ${customer?.firstName || ''} ${customer?.lastName || ''} (${plate_config?.text || 'REG'})`,
      statusCode: 200,
      requestData: req.body,
      responseData: successResponse,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error("Add lead error:", error.response?.data || error.message);
    const errorResponse = {
      error: "Lead capture failed",
      details: error.response?.data || error.message,
    };

    await logAction({
      endpoint: "/api/addleadtodb",
      actionName: "Lead Capture Exception",
      statusCode: 500,
      requestData: req.body,
      responseData: errorResponse,
      error: error.response?.data || error.message,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(500).json(errorResponse);
  }
}