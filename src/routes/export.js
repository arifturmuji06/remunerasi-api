const express = require("express");
const router = express.Router();
const exportController = require("../controllers/export");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

// Anggaran
router.get(
  "/anggaran/pdf",
  isAuth,
  isAdmin,
  exportController.exportSummaryAnggaranPDF
);
router.get(
  "/anggaran/excel",
  isAuth,
  isAdmin,
  exportController.exportSummaryAnggaranExcel
);

// Remunerasi
router.get(
  "/remunerasi/pdf",
  isAuth,
  isAdmin,
  exportController.exportRemunerasiPDF
);
router.get(
  "/remunerasi/excel",
  isAuth,
  isAdmin,
  exportController.exportRemunerasiExcel
);

module.exports = router;
