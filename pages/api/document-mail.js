// pages/api/document-mail.js
import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customer, plate_config } = req.body;

    if (!customer || !plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "orders@plate-maker.co.uk",
      to: `${customer.email}`,
      subject: `Action needed: documents required for your plate order`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmed - Documents Required</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:30px 0;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr>
<td style="background-color:#F8C73A; padding:28px 32px;">
<span style="color:#ffffff; font-size:22px; font-weight:bold; letter-spacing:0.5px;">Private Number Plate Maker</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px;">
<p style="margin:0 0 16px; font-size:16px; color:#1a1a1a;">Hi ${customer.firstName},</p>

<p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#333333;">
Your order for registration <strong>${plate_config.text?.toUpperCase()}</strong> has been placed. Thanks for choosing us.
</p>

<p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#333333;">
Before we can manufacture your plate, DVLA requires us to verify you're entitled to display this registration. Please reply to this email with the following documents:</p>

<h3 style="margin:0 0 8px; font-size:15px; color:#0b1f3a;">1. Proof of entitlement (one of the following)</h3>
<ul style="margin:0 0 20px; padding-left:20px; font-size:14px; line-height:1.7; color:#333333;">
<li><strong>V5C logbook</strong> - clear photo of the full document, front and back</li>
<li><strong>V778 retention certificate</strong> - for personalised registrations on hold</li>
<li><strong>V750 certificate of entitlement</strong> - if you've bought the rights to a private plate</li>
<li>Official government letter confirming number plate ownership or retention</li>
</ul>

<h3 style="margin:0 0 8px; font-size:15px; color:#0b1f3a;">2. Proof of identity</h3>
<ul style="margin:0 0 20px; padding-left:20px; font-size:14px; line-height:1.7; color:#333333;">
<li>UK driving licence, or</li>
<li>Passport</li>
</ul>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f2; border-left:4px solid #c8102e; margin:0 0 24px;">
<tr>
<td style="padding:14px 18px; font-size:13px; line-height:1.6; color:#7a1f1f;">
<strong>Please note:</strong> Screenshots, photocopies, and emailed V5Cs sent as text/edited images are not valid. DVLA requires clear, original images of the physical documents.
</td>
</tr>
</table>

<p style="margin:0 0 4px; font-size:15px; color:#1a1a1a;">Once we've received and verified your documents, your plate will go straight into production.</p>

<p style="margin:20px 0 0; font-size:14px; color:#333333;">Any questions, just mail us at  <a href="mailto:contact@plate-maker.co.uk">contact@plate-maker.co.uk</a> or call us on +442035766603.</p>

<p style="margin:24px 0 0; font-size:15px; color:#1a1a1a;">
Thanks,<br>
The Private Number Plate Maker Team
</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f4f4f4; padding:20px 32px; text-align:center;">
<p style="margin:0; font-size:12px; color:#888888;">
Private Number Plate Maker Ltd &bull; 242 Eastern Ave, Ilford, Essex IG4 5AB<br>
DVLA Registered Number Plate Supplier &bull; RNPS ID 75449
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Document-mail error:", {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return res.status(500).json({
      error: "Failed to send document request email",
      details: error?.response?.data || error.message,
    });
  }
}
