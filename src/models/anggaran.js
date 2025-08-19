const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnggaranSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    periode: {
      type: Number,
      required: true,
      default: new Date().getFullYear(),
    },
    alokasiAnggaran: {
      book: { type: Number, default: 2500000 },
      conference: { type: Number, default: 5000000 },
      nutrition: { type: Number, default: 6000000 },
    },
    penggunaan: {
      penggunaanBook: { type: Number, default: 0 },
      penggunaanConference: { type: Number, default: 0 },
      penggunaanNutrition: { type: Number, default: 0 },
    },
    sisaAnggaran: {
      sisaBook: { type: Number, default: 2500000 },
      sisaConference: { type: Number, default: 5000000 },
      sisaNutrition: { type: Number, default: 6000000 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Anggaran", AnggaranSchema, "anggaran");
