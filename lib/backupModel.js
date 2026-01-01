import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
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
      badge: {
        type: String,
      },
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

const Backup = mongoose.models.Backup || mongoose.model("Backup", backupSchema);
