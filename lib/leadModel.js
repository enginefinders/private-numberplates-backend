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
        legal_type: String,
      front_plate_size: String,
      rear_plate_size: String,
      rear_plate_extra_fee: Number,
      effects: {
        gel3d: Boolean,
        raised4d: Boolean,
        gloss: Boolean,
        shadow: Boolean,
      },
      border: {
        borderSelected: Boolean,
        borderColor: String,
      },
      style: String,
      customSpacing: {
        enabled: Boolean,
        spacing: Number,
      },
      pricing_breakdown: {
        base: Number,
        additionPrice: Number,
        total: Number,
        unitPrice: Number,
      },
      fQuantity: Number,
      rQuantity: Number,
      cartPrice: Number,
      total: Number,
    },
    preview_base64: String,
  },
  { timestamps: true }
);

export default function getLeadsModel() {
  return mongoose.models.Leads || mongoose.model("Leads", leadsSchema);
}
