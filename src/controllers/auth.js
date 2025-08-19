const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // ganti dengan path model kamu

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Input value tidak sesuai!");
      err.errorStatus = 400;
      err.data = errors.array();
      throw err;
    }

    const { nama, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nama,
      email,
      password: hashedPassword,
      role: "karyawan", // default role
      status: "active",
    });

    newUser;
    res.status(201).json({
      message: "Register Success",
      data: {
        nama: newUser.nama,
        email: newUser.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.status !== "active") {
      return res
        .status(401)
        .json({ message: "User tidak ditemukan atau tidak aktif!" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ message: "Password yang anda input salah!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login Success",
      token,
      user: {
        id: user._id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Get current user success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
