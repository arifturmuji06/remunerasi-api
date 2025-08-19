const Remunerasi = require("../models/remunerasi");
const Anggaran = require("../models/anggaran");
const User = require("../models/user"); // untuk ambil nama user

const syncAnggaran = async (userId, periode) => {
  const errors = [];

  if (userId === "ALL") {
    // 🔄 Sync semua user aktif
    const users = await User.find({ status: "active" });

    for (const user of users) {
      try {
        await syncSingleUser(user._id, periode, user.nama);
      } catch (err) {
        const message = `[Sync Skipped] ${user.nama} - ${err.message}`;
        console.warn(message);
        errors.push(message);
      }
    }
  } else {
    // 🔄 Sync satu user
    const user = await User.findById(userId);
    const namaUser = user?.nama || "Unknown User";

    try {
      await syncSingleUser(userId, periode, namaUser);
    } catch (err) {
      const message = `[Sync Skipped] ${namaUser} - ${err.message}`;
      console.warn(message);
      errors.push(message);
    }
  }

  return errors;
};

// ✨ Fungsi reusable untuk sync satu user
const syncSingleUser = async (userId, periode, namaUser = "User ini") => {
  const semuaRemun = await Remunerasi.find({
    pemohon: userId,
    periode: periode,
  });

  let book = 0,
    conference = 0,
    nutrition = 0;

  semuaRemun.forEach((r) => {
    const harga = Number(r.jumlah) || 0;
    const jenis = r.jenis?.toLowerCase();

    if (jenis === "book") book += harga;
    else if (jenis === "conference") conference += harga;
    else if (jenis === "nutrition") nutrition += harga;
  });

  let anggaran = await Anggaran.findOne({ userId, periode });
  if (!anggaran) {
    const err = new Error(
      `Data anggaran belum tersedia untuk ${namaUser} pada periode ${periode}. Silakan generate terlebih dahulu.`
    );
    err.errorStatus = 400;
    throw err;
  }

  anggaran.penggunaan.penggunaanBook = book;
  anggaran.penggunaan.penggunaanConference = conference;
  anggaran.penggunaan.penggunaanNutrition = nutrition;

  anggaran.sisaAnggaran.sisaBook = anggaran.alokasiAnggaran.book - book;
  anggaran.sisaAnggaran.sisaConference =
    anggaran.alokasiAnggaran.conference - conference;
  anggaran.sisaAnggaran.sisaNutrition =
    anggaran.alokasiAnggaran.nutrition - nutrition;

  await anggaran.save();
};

module.exports = syncAnggaran;
