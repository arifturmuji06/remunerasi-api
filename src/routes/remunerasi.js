const express = require("express");
const { body } = require("express-validator");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const upload = require("../middlewares/upload");
const router = express.Router();

const remunerasiController = require("../controllers/remunerasi");

// READ -> GET Ambil semua data remunerasi dari user (User Login)
// Filter -> get("/me?periode=2020")
router.get("/me", isAuth, remunerasiController.getMyRemunerasi);

// CREATE -> POST Tambah data remunerasi (userId dikirim di body)
router.post(
  "/",
  upload.uploadFields,
  [
    body("nama")
      .notEmpty()
      .withMessage("Nama Produk/Kegiatan tidak boleh kosong!")
      .bail()
      .isLength({ min: 5 })
      .withMessage("Input tidak sesuai!"),
    body("jenis")
      .notEmpty()
      .withMessage("Kategori tidak boleh kosong!")
      .bail()
      .isIn(["Conference", "Book", "Nutrition"])
      .withMessage("Pilih sesuai kategori: Conference, Book, atau Nutrition"),
    body("jumlah")
      .notEmpty()
      .withMessage("Jumlah tidak boleh kosong!")
      .bail()
      .isInt({ min: 10000 })
      .withMessage("Jumlah minimal harus Rp. 10.000"),
  ],
  isAuth,
  isAdmin,
  remunerasiController.createRemunerasi
);

// READ -> GET Ambil semua data remunerasi (admin only)
// Filter -> get("/?periode=2020")
router.get("/", /*isAuth, isAdmin,*/ remunerasiController.getAllRemunerasi);

// READ -> GET Ambil detail remunerasi by ID (admin/karyawan)
router.get("/:remunId", remunerasiController.getRemunerasiById);

// UPDATE -> PUT Rubah data remunerasi by ID (admin)
router.patch(
  "/:remunId",
  upload.uploadFields,
  isAuth,
  isAdmin,
  remunerasiController.updateRemunerasiById
);

// DELETE -> DELETE Hapus data remunerasi by ID (Hapus file)
router.delete("/:remunId", remunerasiController.deleteRemunerasi);
module.exports = router;
