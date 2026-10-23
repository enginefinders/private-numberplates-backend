// pages/api/resume-lead.js
import connectDB from "@/lib/mongodb";
import getLeadsModel from "@/lib/leadModel";
import getBackupModel from "@/lib/backupModel";
import { logAction } from "@/lib/monitoringLogger";

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = (req.query.t || "").toString().trim();
  if (!token) {
    return res.status(400).json({ valid: false, reason: "missing_token" });
  }

  try {
    await connectDB();
    const Leads = getLeadsModel();
    const Backup = getBackupModel();

    const lead = await Leads.findOne({ resumeToken: token });
    if (!lead || lead.resumeTokenExpired || lead.status === "Converted") {
      await logAction({
        endpoint: "/api/resume-lead",
        actionName: "Resume Token Rejected (Expired or Not Found)",
        statusCode: 200,
        requestData: { token },
        responseData: { valid: false, reason: "expired" },
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);

      return res.status(200).json({ valid: false, reason: "expired" });
    }

    // Safety check: if an order with this customer's email and plate text already exists, expire the token now
    if (lead.customer?.email) {
      const existingOrder = await Backup.findOne({
        "customer.email": lead.customer.email,
        "plate_config.text": lead.plate_config?.text,
      }).lean();

      if (existingOrder) {
        lead.resumeTokenExpired = true;
        await lead.save().catch(console.error);

        return res.status(200).json({ valid: false, reason: "expired" });
      }
    }

    const finalProduct = {
      product_id: lead.product_id,
      quantity: lead.quantity || 1,
      preview_base64: lead.preview_base64 || null,
      plate_config: lead.plate_config,
    };

    const customerDetails = {
      customer: lead.customer || {},
    };

    const responseData = {
      valid: true,
      finalProduct,
      customerDetails,
      discountCode: lead.offeredDiscountCode || null,
    };

    await logAction({
      endpoint: "/api/resume-lead",
      actionName: `Cart Resumed via Token: ${lead.customer?.email || "Unknown"} (${lead.plate_config?.text || "REG"})`,
      statusCode: 200,
      requestData: { token },
      responseData: { valid: true, discountCode: lead.offeredDiscountCode },
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Resume lead error:", error);
    return res.status(500).json({ valid: false, reason: "server_error" });
  }
}
