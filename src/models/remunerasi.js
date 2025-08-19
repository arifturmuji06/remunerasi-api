const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RemunerasiSchema = new Schema(
  {
    jenis: {
      type: String,
      enum: ["Book", "Conference", "Nutrition"],
      required: true,
    },
    nama: {
      type: String,
      required: true,
    },
    jumlah: {
      type: Number,
      required: true,
    },
    periode: {
      type: Number,
      default: new Date().getFullYear(),
      min: 2000,
      max: 2100,
    },
    tanggalPembelian: {
      type: Date,
      required: true,
    },
    gambar: {
      type: String,
      required: true,
    },
    buktiPembelian: {
      type: String,
      required: true,
    },
    proposal: {
      type: String,
    },
    keterangan: {
      type: String,
      required: true,
    },
    pemohon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Remunerasi", RemunerasiSchema, "remunerasi");
