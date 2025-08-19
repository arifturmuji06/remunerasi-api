const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const userController = require("../controllers/user");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const { uploadProfile } = require("../middlewares/upload");
const User = require("../models/user");

router.get("/me", isAuth, userController.getLoginUser);
router.get("/active", isAuth, userController.getActiveUser);
router.get("/inactive", isAuth, userController.getInactiveUser);
router.get("/", isAuth, isAdmin, userController.getAllUsers);
router.get("/:id", isAuth, userController.getUserById);
router.post(
  "/tambah-karyawan",
  uploadProfile.single("profilePicture"),
  body("nama")
    .notEmpty()
    .withMessage("Nama tidak boleh kosong!")
    .bail()
    .isLength({ min: 5 })
    .withMessage("Nama minimal 5 karakter!"),
  body("email")
    .notEmpty()
    .withMessage("Email tidak boleh kosong!")
    .bail()
    .isEmail()
    .withMessage("Format email tidak valid!")
    .bail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error("Email sudah terdaftar");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("Password tidak boleh kosong!")
    .bail()
    .isLength({ min: 10 })
    .withMessage("Password minimal 10 karakter!"),
  isAuth,
  isAdmin,
  userController.createUser
);
router.patch(
  "/:id",
  uploadProfile.single("profilePicture"),
  isAuth,
  isAdmin,
  userController.updateUser
);
router.delete("/:id", isAuth, isAdmin, userController.softDeleteUser);
router.patch("/:id/reactivate", isAuth, isAdmin, userController.reactivateUser);

module.exports = router;
