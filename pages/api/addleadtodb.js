// pages/api/checkout.js
import axios from "axios";
import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import getLeadsModel from "@/lib/leadModel";

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
        // split on underscores, hyphens, or one/more spaces
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((word) => {
          // Capitalize only if the word starts with a letter
          if (/^[a-zA-Z]/.test(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          return word; // numbers or mixed starting with number
        })
        .join(" ")
    );
  };
  try {
    // ✅ CONNECT DB
    await connectDB();

    const body = req.body;
    const { customer, plate_config, quantity, paymentMethod } = body;

    if (!plate_config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ SAVE BACKUP (DIRECT SAVE)
    const lead = getLeadsModel(); // ✅ always get the model safely

    const bodys = req.body;
    const makeALead = await lead.create(bodys);

    return res.status(200).json({
      success: true,    });
  } catch (error) {
    console.error("Checkout error:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Checkout failed",
      details: error.response?.data || error.message,
    });
  }
}
