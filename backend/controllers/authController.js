import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  studentId: user.studentId,
  role: user.role,
  vehicleNumber: user.vehicleNumber,
  mobileNumber: user.mobileNumber || "",
  department: user.department,
  assignedBlock: user.assignedBlock || null
});

const register = async (req, res) => {
  try {
    const { studentId, name, department, vehicleNumber, password } = req.body;
    if (!studentId || !name || !department || !vehicleNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const exists = await User.findOne({ studentId });
    if (exists) return res.status(400).json({ message: "Student ID already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ studentId, name, department, vehicleNumber, password: hashed });
    return res.status(201).json({ token: generateToken(user._id), user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const user = await User.findOne({ studentId });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.isActive === false) return res.status(403).json({ message: "Account deactivated" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    return res.json({ token: generateToken(user._id), user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  return res.json(serializeUser(req.user));
};

const updateProfile = async (req, res) => {
  try {
    const { name, mobileNumber, vehicleNumber, department, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
    if (vehicleNumber) user.vehicleNumber = vehicleNumber.toUpperCase();
    if (department) user.department = department;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password required" });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: "Current password incorrect" });
      if (newPassword.length < 6) return res.status(400).json({ message: "New password too short" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return res.json(serializeUser(user));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export { register, login, getProfile, updateProfile };
