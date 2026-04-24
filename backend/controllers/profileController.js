// controllers/profileController.js
import User from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("donations");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

