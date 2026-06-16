import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  blockId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  blockName: { type: String, required: true, trim: true },
  qrUrl: { type: String, default: "" },
  description: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Block || mongoose.model("Block", blockSchema);
