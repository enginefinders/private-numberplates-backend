import connectDB from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connectDB();
    return res.status(200).json({
      success: true,
      message: "MongoDB connected successfully 🚀",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "MongoDB connection failed ❌",
      error: error.message,
    });
  }
}
