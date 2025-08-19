const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/auth");
const isAuth = require("../middlewares/isAuth");
const User = require("../models/user");

router.post(
  "/register",
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
  authController.register
);

router.post("/login", authController.login);
router.get("/me", isAuth, authController.me); // protected route

module.exports = router;
