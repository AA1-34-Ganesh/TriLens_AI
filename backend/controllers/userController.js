import User from "../models/User.js";
import bcrypt from "bcryptjs";

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim() || "";
    const role = req.query.role?.trim() || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } }
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["name", "department", "vehicleNumber", "mobileNumber", "role", "assignedBlock", "isActive"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(id, { password: hashed }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { studentId, name, password, department, vehicleNumber, role, assignedBlock } = req.body;
    
    if (!studentId || !name || !password) {
      return res.status(400).json({ message: "Student ID, Name, and Password are required" });
    }

    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ message: "User with this ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      studentId,
      name,
      password: hashedPassword,
      department: department || "",
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : "",
      role: role || "student",
      assignedBlock: role === "blockAdmin" ? assignedBlock : undefined
    });

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    
    return res.status(201).json(userObj);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export { getUsers, updateUser, resetUserPassword, deleteUser, createUser };
