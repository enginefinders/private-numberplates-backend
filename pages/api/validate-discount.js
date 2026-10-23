// pages/api/validate-discount.js
import connectDB from "@/lib/mongodb";
import getDiscountModel, { evaluateDiscountStatus } from "@/lib/discountModel";
import { logAction } from "@/lib/monitoringLogger";

// Simple in-memory rate limiter (30 requests/minute per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 30;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      valid: false,
      reason: "rate_limited",
      error: "Too many attempts. Please try again shortly.",
    });
  }

  const rawCode = req.method === "GET" ? req.query.code : req.body?.code;
  const code = (rawCode || "").toString().trim().toUpperCase();

  if (!code || code.length !== 6) {
    return res.status(400).json({
      valid: false,
      reason: "invalid_format",
      error: "Discount code must be 6 characters",
    });
  }

  try {
    await connectDB();
    const Discount = getDiscountModel();

    const discount = await Discount.findOne({ code }).lean();
    const status = evaluateDiscountStatus(discount);

    if (status !== "Active") {
      const reason = status === "Invalid" ? "invalid" : status.toLowerCase().replace(/\s+/g, "_");
      await logAction({
        endpoint: "/api/validate-discount",
        actionName: `Discount Validation Failed: ${code} (${reason})`,
        statusCode: 200,
        requestData: { code },
        responseData: { valid: false, reason },
        durationMs: Date.now() - startTime,
        req,
      }).catch(console.error);

      return res.status(200).json({ valid: false, reason });
    }

    const responseData = {
      valid: true,
      code: discount.code,
      percent: discount.percent,
    };

    await logAction({
      endpoint: "/api/validate-discount",
      actionName: `Discount Validated: ${discount.code} (${discount.percent}%)`,
      statusCode: 200,
      requestData: { code },
      responseData,
      durationMs: Date.now() - startTime,
      req,
    }).catch(console.error);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Discount validation error:", error);
    return res.status(500).json({
      valid: false,
      reason: "server_error",
      error: "Validation failed",
    });
  }
}
