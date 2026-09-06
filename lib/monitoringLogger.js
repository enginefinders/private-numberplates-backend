import mongoose from "mongoose";
import connectDB from "./mongodb";

// Schema for 'monitoring' collection
const MonitoringSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, index: true },
    actionName: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    statusCategory: { type: String, enum: ["successful", "errors"], required: true, index: true },
    isResolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
    emailAlertSent: { type: Boolean, default: false, index: true },
    emailAlertSentAt: { type: Date },
    error: { type: String },
    requestData: { type: mongoose.Schema.Types.Mixed },
    responseData: { type: mongoose.Schema.Types.Mixed },
    summary: {
      regNumber: String,
      plateType: String,
      customerName: String,
      customerEmail: String,
      customerPhone: String,
      cartTotal: Number,
      previewText: String,
    },
    ip: String,
    userAgent: String,
    durationMs: Number,
  },
  { timestamps: true, collection: "monitoring" }
);

const getMonitoringModel = () => {
  return mongoose.models.Monitoring || mongoose.model("Monitoring", MonitoringSchema);
};

export async function logAction({
  endpoint,
  actionName,
  statusCode,
  requestData,
  responseData,
  error = null,
  durationMs = 0,
  req = null,
}) {
  try {
    await connectDB();
    const Monitoring = getMonitoringModel();

    const isError = statusCode >= 400 || !!error;
    const statusCategory = isError ? "errors" : "successful";

    // Extract basic summary fields for fast table preview
    const body = requestData || {};
    const plate = body.plate_config || body || {};
    const customer = body.customer || body || {};

    let extractedTotal = undefined;
    if (plate.total !== undefined && !isNaN(Number(plate.total))) {
      extractedTotal = Number(Number(plate.total).toFixed(2));
    } else if (body.cartTotal !== undefined && !isNaN(Number(body.cartTotal))) {
      extractedTotal = Number(Number(body.cartTotal).toFixed(2));
    } else if (body.amount !== undefined && !isNaN(Number(body.amount))) {
      const numAmount = Number(body.amount);
      if (numAmount >= 500) {
        extractedTotal = Number((numAmount / 100).toFixed(2));
      } else {
        extractedTotal = Number(numAmount.toFixed(2));
      }
    }

    const summary = {
      regNumber: plate.text ? String(plate.text).toUpperCase() : body.regNumber || body.registration || undefined,
      plateType: plate.plate_type || body.plateType || undefined,
      customerName: customer.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : body.customerName || undefined,
      customerEmail: customer.email || body.customerEmail || undefined,
      customerPhone: customer.phone || body.customerPhone || undefined,
      cartTotal: extractedTotal,
      previewText: `${actionName} | ${endpoint} | Status: ${statusCode}`,
    };

    const doc = await Monitoring.create({
      endpoint,
      actionName,
      statusCode,
      statusCategory,
      isResolved: !isError,
      emailAlertSent: !isError,
      error: error ? (typeof error === "object" ? error.message || JSON.stringify(error) : String(error)) : null,
      requestData,
      responseData,
      summary,
      durationMs,
      ip: req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });

    return doc;
  } catch (err) {
    console.error("Backend monitoring logger error:", err);
  }
}
