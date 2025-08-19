const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { validationResult } = require("express-validator");

// Panggil semua User (Admin Only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ message: "Get all users success", data: users });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

// Panggil semua User (Admin Only)
exports.getLoginUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const filter = { _id: userId };
    const myRemunerasi = await User.find(filter);

    res.status(200).json({
      message: "Data milik user ditemukan",
      data: myRemunerasi,
    });
  } catch (err) {
    next(err);
  }
};

// Panggil User by Id & Status Active (untuk form select karyawan)
exports.getActiveUser = async (req, res) => {
  try {
    const users = await User.find({ status: "active" });
    res.status(200).json({ message: "Active User: ", data: users });
  } catch (err) {
    next(err);
  }
};

// Panggil User by Id & Status Inactive (untuk form select karyawan)
exports.getInactiveUser = async (req, res) => {
  try {
    const users = await User.find({ status: "inactive" });
    res.status(200).json({ message: "Inactive User: ", data: users });
  } catch (err) {
    next(err);
  }
};

// Panggil User by Id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Get user success", data: user });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

// Create Karyawan (Admin Only)
exports.createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Input value tidak sesuai!");
      err.errorStatus = 400;
      err.data = errors.array();
      throw err;
    }

    const { nama, email, password, kontak, tahunMasuk, departemen, jabatan } =
      req.body;

    // Ambil path file profilePicture jika ada
    let profilePicture = null;
    if (req.file) {
      profilePicture = req.file.path.replace(/\\/g, "/"); // biar path universal
    }

    // Cek email sudah dipakai
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return res.status(400).json({ message: "Email sudah terdaftar" });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nama,
      email,
      password: hashedPassword,
      role: "karyawan",
      status: "active",
      kontak,
      tahunMasuk,
      departemen,
      jabatan,
      profilePicture,
    });

    res.status(201).json({
      message: "User created",
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};

// Update Data Karyawan (Admin Only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cari user
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ambil data dari body, tapi exclude email, password, role, status
    const { nama, departemen, jabatan, kontak, tahunMasuk } = req.body;

    // Handle profilePicture (jika ada upload baru)
    let profilePicture = user.profilePicture; // default: tetap yg lama
    if (req.file) {
      profilePicture = req.file.path.replace(/\\/g, "/");
    }

    // Update field yg boleh diubah
    user.nama = nama || user.nama;
    user.departemen = departemen || user.departemen;
    user.jabatan = jabatan || user.jabatan;
    user.kontak = kontak || user.kontak;
    user.tahunMasuk = tahunMasuk || user.tahunMasuk;
    user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// Soft DELETE (Ganti status active -> inactive)
exports.softDeleteUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deactivated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

// Aktivasi kembali user (Ganti status inactive -> active)
exports.reactivateUser = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User reactivated", data: updated });
  } catch (err) {
    next(err);
  }
};
