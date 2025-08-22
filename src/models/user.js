const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  nama: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "karyawan"],
    default: "karyawan",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  departemen: {
    type: String,
  },
  jabatan: {
    type: String,
  },
  kontak: {
    type: String,
  },
  tahunMasuk: {
    type: Date,
  },
  profilePicture: {
    type: String,
    default: "file/profile/default.png",
  },
});

module.exports = mongoose.model("User", UserSchema, "user");
