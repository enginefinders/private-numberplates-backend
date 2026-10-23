import mongoose from "mongoose";
import crypto from "crypto";

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    percent: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    validityHours: {
      type: Number,
      required: true,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maxUses: {
      type: Number,
      required: true,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "admin",
    },
    redemptions: [
      {
        orderNumber: String,
        paymentIntentId: String,
        customerEmail: String,
        subtotal: Number,
        discountAmount: Number,
        at: { type: Date, default: Date.now },
      },
    ],
    offers: [
      {
        leadId: String,
        leadEmail: String,
        by: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  return result;
}

export function evaluateDiscountStatus(discount) {
  if (!discount) return "Invalid";
  if (!discount.active) return "Deactivated";
  if (new Date() >= new Date(discount.expiresAt)) return "Expired";
  if (discount.usedCount >= discount.maxUses) return "Used up";
  return "Active";
}

export default function getDiscountModel() {
  return mongoose.models.Discount || mongoose.model("Discount", discountSchema);
}
