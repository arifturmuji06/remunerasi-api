const express = require("express");
const router = express.Router();
const {
  uploadImage,
  uploadProfile,
  uploadProposal,
  uploadReceipt,
} = require("../middlewares/upload");

// Upload gambar remunerasi
router.post("/image", uploadImage.single("gambar"), (req, res) => {
  res.status(201).json({
    message: "Gambar berhasil diupload!",
    filePath: `/file/images/${req.file.filename}`,
  });
});

// Upload profile picture karyawan
router.post("/profile", uploadProfile.single("profile"), (req, res) => {
  res.status(201).json({
    message: "Foto profil berhasil diupload!",
    filePath: `/file/profile/${req.file.filename}`,
  });
});

// Upload proposal conference (PDF)
router.post("/proposal", uploadProposal.single("proposal"), (req, res) => {
  res.status(201).json({
    message: "Proposal berhasil diupload!",
    filePath: `/file/proposal/${req.file.filename}`,
  });
});

// Upload bukti pembelian (PDF)
router.post("/bukti", uploadReceipt.single("bukti"), (req, res) => {
  res.status(201).json({
    message: "Bukti pembelian berhasil diupload!",
    filePath: `/file/receipt/${req.file.filename}`,
  });
});

module.exports = router;
