import connectDB from "@/lib/mongodb";
import getBackupModel from "@/lib/backupModel";

const PAGE_SIZE = 10;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * PAGE_SIZE;

    await connectDB();
    const Backup = getBackupModel();

    const [backups, total] = await Promise.all([
      Backup.find()
        .select("-preview_base64")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Backup.countDocuments(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return res.status(200).json({
      success: true,
      backups,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Backups fetch error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
