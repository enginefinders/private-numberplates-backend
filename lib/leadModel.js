import mongoose from "mongoose";

const leadsSchema = new mongoose.Schema(
  {
    product_id: Number,
    quantity: Number,

    customer: {
      firstName: String,
      lastName: String,
      email: String,
      phone: Number,
      address1: String,
      address2: String,
      city: String,
      postcode: String,
      country: String,
    },

    plate_config: {
      plate_type: String,
      text: String,
      plate_size: String,
      sides: String,
      hexPlate: Boolean,
      badge:  String,
      freeKit: {
        pads: Boolean,
        screws: Boolean,
      },
      total: Number,
    },

    preview_base64: String,
  },
  { timestamps: true }
);

export default function getLeadsModel() {
  return mongoose.models.Leads || mongoose.model("Leads", leadsSchema);
}
