import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  mobileNumber: { type: String, default: "", trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "blockAdmin"], default: "student" },
  assignedBlock: { type: String, default: null, trim: true, uppercase: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
