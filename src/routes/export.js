const express = require("express");
const router = express.Router();
const exportController = require("../controllers/export");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

// Anggaran
router.get("/anggaran/pdf", isAuth, exportController.exportSummaryAnggaranPDF);
router.get(
  "/anggaran/excel",
  isAuth,
  exportController.exportSummaryAnggaranExcel
);

// Remunerasi
router.get("/remunerasi/pdf", isAuth, exportController.exportRemunerasiPDF);
router.get("/remunerasi/excel", isAuth, exportController.exportRemunerasiExcel);

module.exports = router;
