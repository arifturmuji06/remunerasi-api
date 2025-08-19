const express = require("express");
const router = express.Router();
const anggaranController = require("../controllers/anggaran");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

// Create anggaran tahunan per karyawan (satu karyawan satu anggaran per tahun)
// router.post("/", isAuth, isAdmin, anggaranController.createAnggaran);

// Create anggaran semua karyawan active (per tahun)
router.post(
  "/generate-all",
  isAuth,
  isAdmin,
  anggaranController.generateAllAnggaran
);

// Ambil semua anggaran (admin)
router.get("/", isAuth, isAdmin, anggaranController.getAllAnggaran);

// Ambil anggaran milik user yang login
router.get("/me", isAuth, anggaranController.getMyAnggaran);

// Dashboard summary (total penggunaan & sisa)
router.get(
  "/dashboard/card-summary",
  isAuth,
  isAdmin,
  anggaranController.getSummaryAnggaran
);

// Dashboard summary by Id (total penggunaan & sisa)
router.get(
  "/summary/:userId",
  isAuth,
  isAdmin,
  anggaranController.getSummaryAnggaranByUserId
);

// Dashboard summary (total penggunaan & sisa)
router.get("/me/card-summary", isAuth, anggaranController.getMySummaryAnggaran);

module.exports = router;
