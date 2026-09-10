// pages/api/document-mail.js
import { Resend } from "resend";
import { logAction } from "@/lib/monitoringLogger";

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    const errorResponse = { error: "Method not allowed" };
    await logAction({
      endpoint: "/api/document-mail",
      actionName: "Document Mail Rejected (Method Not Allowed)",
      statusCode: 405,
      requestData: req.body,
      responseData: errorResponse,
      error: "Method not allowed",
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);
    return res.status(405).json(errorResponse);
  }

  try {
    const { customer, plate_config, orderCode } = req.body || {};

    if (!customer || !plate_config) {
      const errorResponse = { error: "Missing required fields" };
      await logAction({
        endpoint: "/api/document-mail",
        actionName: "Document Mail Failed (Missing customer/plate_config)",
        statusCode: 400,
        requestData: req.body,
        responseData: errorResponse,
        error: "Missing required fields in request body",
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);
      return res.status(400).json(errorResponse);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const displayOrderCode = orderCode || (plate_config?.text ? `PNPM-${plate_config.text.toUpperCase()}` : "PENDING");
    const regText = (plate_config?.text || "").toUpperCase();
    const firstName = customer?.firstName || "Valued Customer";

    const emailResult = await resend.emails.send({
      from: "orders@plate-maker.co.uk",
      to: `${customer.email}`,
      subject: `Action Required: Upload Documents for Order ${displayOrderCode}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Action Required: Upload Documents for Order ${displayOrderCode}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:30px 15px;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">

  <!-- 1. Header Banner -->
  <tr>
    <td style="background-color:#F3C544; padding:24px 32px; border-bottom:3px solid #000000;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="color:#000000; font-size:20px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">
              PRIVATE NUMBER PLATE MAKER
            </span>
          </td>
          <td align="right">
            <span style="background-color:#000000; color:#F3C544; font-size:10px; font-weight:800; padding:4px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
              RNPS #75449
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- 2. Main Content -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 16px; font-size:16px; color:#111827; font-weight:600;">
        Hi ${firstName},
      </p>

      <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#374151;">
        Thank you for your order. Before we can manufacture and dispatch your plate for registration <strong>${regText}</strong>, the DVLA legally requires us to verify your proof of entitlement and identity.
      </p>

      <!-- Order Reference Callout Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; margin:0 0 24px;">
        <tr>
          <td style="padding:16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:block; font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px;">Your Order ID</span>
                  <span style="font-size:20px; font-weight:900; color:#111827; font-family:monospace; letter-spacing:1px;">${displayOrderCode}</span>
                </td>
                <td align="right">
                  <span style="display:block; font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px;">Registration</span>
                  <span style="background-color:#F3C544; color:#000000; font-size:14px; font-weight:900; font-family:monospace; padding:4px 10px; border-radius:4px; display:inline-block;">
                    ${regText}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- PRIMARY OPTION: ONLINE UPLOAD PORTAL -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB; border:2px solid #F59E0B; border-radius:10px; margin:0 0 24px; overflow:hidden;">
        <tr>
          <td style="padding:20px 24px; text-align:center;">
            <span style="display:inline-block; background-color:#F59E0B; color:#000000; font-size:11px; font-weight:800; padding:3px 10px; border-radius:12px; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">
              ⚡ Primary Option &bull; Fast-Track
            </span>
            <h3 style="margin:0 0 8px; font-size:17px; font-weight:800; color:#92400E;">
              Submit Documents via Secure Portal
            </h3>
            <p style="margin:0 0 16px; font-size:13px; line-height:1.5; color:#78350F;">
              Upload photos directly using your phone or computer for <strong>instant verification</strong> and immediate queueing into our manufacturing line.
            </p>

            <!-- Big Yellow CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
              <tr>
                <td style="border-radius:8px; background-color:#F3C544;">
                  <a href="https://docs.plate-maker.co.uk/?order=${encodeURIComponent(displayOrderCode)}" target="_blank" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:900; color:#000000; text-decoration:none; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    Upload Documents Online &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0; font-size:11px; color:#92400E;">
              Portal Login: Enter your Order ID (<strong>${displayOrderCode}</strong>) and delivery postcode.
            </p>
          </td>
        </tr>
      </table>

      <!-- Required Documents Checklist -->
      <h3 style="margin:0 0 12px; font-size:15px; font-weight:800; color:#111827; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
        Required Documents (2 Items Needed)
      </h3>

      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#1F2937;">
          1. Proof of Entitlement (One of the following):
        </p>
        <ul style="margin:0; padding-left:20px; font-size:13px; line-height:1.6; color:#4B5563;">
          <li><strong>V5C Logbook</strong> &ndash; Clear photo of page 2 & 3 or front/back</li>
          <li><strong>V778 Retention Certificate</strong> &ndash; If on retention</li>
          <li><strong>V750 Certificate of Entitlement</strong> &ndash; If bought new</li>
          <li>Official Government / DVLA confirmation letter</li>
        </ul>
      </div>

      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#1F2937;">
          2. Proof of Personal Identity (One of the following):
        </p>
        <ul style="margin:0; padding-left:20px; font-size:13px; line-height:1.6; color:#4B5563;">
          <li>UK Driving Licence (Full or Provisional)</li>
          <li>Valid Passport</li>
        </ul>
      </div>

      <!-- DVLA Compliance Note -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF2F2; border-left:4px solid #EF4444; border-radius:4px; margin:0 0 24px;">
        <tr>
          <td style="padding:12px 16px; font-size:12px; line-height:1.5; color:#991B1B;">
            <strong>Physical Photo Requirement:</strong> Screenshots, digital PDFs, photocopies, or edited text files cannot be accepted under DVLA RNPS regulations. Please provide clear, glare-free photos of the actual physical documents.
          </td>
        </tr>
      </table>

      <!-- SECONDARY OPTION: EMAIL REPLY -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 6px; font-size:13px; font-weight:700; color:#374151;">
              ✉️ Secondary Option: Reply to this Email
            </p>
            <p style="margin:0; font-size:12px; line-height:1.6; color:#6B7280;">
              Alternatively, you can reply directly to this email with your document photos attached.  
              <span style="color:#B45309; font-weight:600;">(Please note: Manual email review requires verification by our team and can take up to 24&ndash;48 hours longer for approval).</span>
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0; font-size:13px; color:#4B5563;">
        Questions or assistance needed? Reply to this email, contact us at <a href="mailto:contact@plate-maker.co.uk" style="color:#D97706; text-decoration:none; font-weight:600;">contact@plate-maker.co.uk</a>, or call <strong>+44 20 3576 6603</strong>.
      </p>

      <p style="margin:20px 0 0; font-size:14px; color:#111827; font-weight:600;">
        Thank you,<br>
        <span style="font-weight:400; color:#4B5563;">The Private Number Plate Maker Team</span>
      </p>
    </td>
  </tr>

  <!-- 3. Footer -->
  <tr>
    <td style="background-color:#F9FAFB; padding:20px 32px; border-top:1px solid #E5E7EB; text-align:center;">
      <p style="margin:0 0 4px; font-size:11px; color:#6B7280; font-weight:600;">
        Private Number Plate Maker Ltd &bull; 242 Eastern Ave, Ilford, Essex IG4 5AB
      </p>
      <p style="margin:0; font-size:11px; color:#9CA3AF;">
        Registered Supplier RNPS ID 75449 &bull; Company #16500838 &bull; BS AU 145e Compliant
      </p>
    </td>
  </tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    });

    const successResponse = { success: true, emailId: emailResult?.data?.id };

    await logAction({
      endpoint: "/api/document-mail",
      actionName: `Document Request Email Sent: ${customer.email} (${plate_config.text?.toUpperCase() || 'REG'})`,
      statusCode: 200,
      requestData: req.body,
      responseData: successResponse,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error("Document-mail error:", {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    const errorResponse = {
      error: "Failed to send document request email",
      details: error?.response?.data || error.message,
    };

    await logAction({
      endpoint: "/api/document-mail",
      actionName: "Document Request Email Failed",
      statusCode: 500,
      requestData: req.body,
      responseData: errorResponse,
      error: error?.message || "Failed to send document email",
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(500).json(errorResponse);
  }
}
