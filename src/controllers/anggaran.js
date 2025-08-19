const User = require("../models/user");
const Anggaran = require("../models/anggaran");
const syncAnggaran = require("../helpers/syncAnggaran");

exports.generateAllAnggaran = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    // ambil semua user aktif
    const users = await User.find({ status: "active" });

    if (!users.length) {
      return res
        .status(404)
        .json({ message: "Tidak ada user aktif ditemukan!" });
    }

    // Alokasi default
    const alokasiDefault = {
      book: 2500000,
      conference: 5000000,
      nutrition: 6000000,
    };

    // Loop semua user
    const createdAnggaran = [];
    for (let user of users) {
      // Cek apakah anggaran user untuk tahun tsb sudah ada
      const existing = await Anggaran.findOne({
        userId: user._id,
        periode: tahun,
      });
      if (existing) continue; // skip jika sudah ada

      const penggunaan = {
        penggunaanBook: 0,
        penggunaanConference: 0,
        penggunaanNutrition: 0,
      };

      const sisa = {
        sisaBook: alokasiDefault.book,
        sisaConference: alokasiDefault.conference,
        sisaNutrition: alokasiDefault.nutrition,
      };

      const newData = new Anggaran({
        userId: user._id,
        periode: tahun,
        alokasiAnggaran: alokasiDefault,
        penggunaan,
        sisaAnggaran: sisa,
      });

      const saved = await newData.save();
      createdAnggaran.push(saved);
    }

    res.status(201).json({
      message: `${createdAnggaran.length} anggaran berhasil dibuat untuk tahun ${tahun}`,
      data: createdAnggaran,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllAnggaran = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    const data = await Anggaran.find({ periode: tahun }).populate({
      path: "userId",
      select: "nama email status",
    });

    res.status(200).json({
      message: `Data anggaran tahun ${tahun} berhasil diambil`,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyAnggaran = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const userId = req.user.userId; // dari token
    const nama = req.user.nama; // dari token

    const data = await Anggaran.findOne({
      userId,
      periode: tahun,
      nama,
    }).populate({
      path: "userId",
      select: "nama ",
    });

    if (!data) {
      return res.status(404).json({
        message: `Anggaran tahun ${tahun} tidak ditemukan untuk user ini`,
      });
    }

    res.status(200).json({
      message: `Data anggaran tahun ${tahun} berhasil diambil`,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSummaryAnggaran = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    // Sync semua anggaran terlebih dahulu sebelum get summary
    const syncErrors = await syncAnggaran("ALL", tahun); // ALL = custom logic di utils untuk sync semua user

    // Ambil semua anggaran tahun berjalan
    const anggaranList = await Anggaran.find({ periode: tahun });

    // if (!anggaranList || anggaranList.length === 0) {
    //   return res.status(404).json({
    //     message: `Data anggaran untuk tahun ${tahun} tidak ditemukan`,
    //   });
    // }

    if (!anggaranList || anggaranList.length === 0) {
      return res.status(200).json({
        message: `Data anggaran untuk tahun ${tahun} tidak ditemukan`,
        data: {
          syncError: syncErrors.length > 0 ? syncErrors : null,
        },
      });
    }

    // Hitung jumlah karyawan aktif & sudah ada anggaran
    const jumlahKaryawanAktif = await Anggaran.countDocuments({
      periode: tahun,
    });

    // Inisialisasi total
    let totalPenggunaan = {
      book: 0,
      conference: 0,
      nutrition: 0,
    };

    let totalSisa = {
      book: 0,
      conference: 0,
      nutrition: 0,
    };

    let totalAlokasi = {
      book: 0,
      conference: 0,
      nutrition: 0,
    };

    // Hitung akumulasi dari semua karyawan
    anggaranList.forEach((item) => {
      totalPenggunaan.book += item.penggunaan.penggunaanBook || 0;
      totalPenggunaan.conference += item.penggunaan.penggunaanConference || 0;
      totalPenggunaan.nutrition += item.penggunaan.penggunaanNutrition || 0;

      totalSisa.book += item.sisaAnggaran.sisaBook || 0;
      totalSisa.conference += item.sisaAnggaran.sisaConference || 0;
      totalSisa.nutrition += item.sisaAnggaran.sisaNutrition || 0;

      totalAlokasi.book += item.alokasiAnggaran.book || 0;
      totalAlokasi.conference += item.alokasiAnggaran.conference || 0;
      totalAlokasi.nutrition += item.alokasiAnggaran.nutrition || 0;
    });

    // Hitung nilai riil:
    const totalAnggaranRemunerasi =
      totalAlokasi.book + totalAlokasi.conference + totalAlokasi.nutrition;
    const totalPenggunaanAnggaran =
      totalPenggunaan.book +
      totalPenggunaan.conference +
      totalPenggunaan.nutrition;
    const saldoAwal = totalAnggaranRemunerasi;
    const saldoAkhir = totalAnggaranRemunerasi - totalPenggunaanAnggaran;

    res.status(200).json({
      message: `Dashboard ringkasan anggaran tahun ${tahun}`,
      data: {
        periode: tahun,
        jumlahKaryawanAktif,
        totalAlokasiAnggaran: totalAnggaranRemunerasi,
        totalPenggunaanAnggaran,
        saldoRiilAwalPeriode: saldoAwal,
        saldoRiilAkhirPeriode: saldoAkhir,
        perKategori: {
          totalPenggunaan,
          totalSisa,
          totalAlokasi,
        },
        syncError: syncErrors.length > 0 ? syncErrors : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSummaryAnggaranByUserId = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const { userId } = req.params;

    // Sinkronisasi anggaran user dulu
    await syncAnggaran(userId, tahun);

    // Ambil anggaran dari userId dan periode
    const anggaran = await Anggaran.findOne({
      userId,
      periode: tahun,
    }).populate({
      path: "userId",
      select: "nama email",
    });

    if (!anggaran) {
      return res.status(404).json({
        message: `Data anggaran tahun ${tahun} untuk user ini tidak ditemukan`,
      });
    }

    const { alokasiAnggaran, penggunaan, sisaAnggaran } = anggaran;

    const totalAlokasi =
      (alokasiAnggaran.book || 0) +
      (alokasiAnggaran.conference || 0) +
      (alokasiAnggaran.nutrition || 0);

    const totalPenggunaan =
      (penggunaan.penggunaanBook || 0) +
      (penggunaan.penggunaanConference || 0) +
      (penggunaan.penggunaanNutrition || 0);

    const saldoAwal = totalAlokasi;
    const saldoAkhir = saldoAwal - totalPenggunaan;

    res.status(200).json({
      message: `Ringkasan anggaran user ${anggaran.userId.nama} tahun ${tahun}`,
      data: {
        userId,
        nama: anggaran.userId.nama,
        email: anggaran.userId.email,
        periode: tahun,
        totalAlokasiAnggaran: totalAlokasi,
        totalPenggunaanAnggaran: totalPenggunaan,
        saldoRiilAwalPeriode: saldoAwal,
        saldoRiilAkhirPeriode: saldoAkhir,
        perKategori: {
          alokasi: alokasiAnggaran,
          penggunaan: {
            book: penggunaan.penggunaanBook || 0,
            conference: penggunaan.penggunaanConference || 0,
            nutrition: penggunaan.penggunaanNutrition || 0,
          },
          sisa: sisaAnggaran,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMySummaryAnggaran = async (req, res, next) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
    const userId = req.user.userId; // dari token

    // 🔄 Sync anggaran user ini dulu
    await syncAnggaran(userId, tahun);

    // Ambil anggaran milik user yang login dan sesuai tahun
    const anggaran = await Anggaran.findOne({
      userId,
      periode: tahun,
    }).populate({
      path: "userId",
      select: "nama ",
    });

    if (!anggaran) {
      return res.status(404).json({
        message: `Data anggaran tahun ${tahun} untuk user ini tidak ditemukan`,
      });
    }

    const { alokasiAnggaran, penggunaan, sisaAnggaran } = anggaran;

    // Hitung total alokasi dan penggunaan
    const totalAlokasi =
      (alokasiAnggaran.book || 0) +
      (alokasiAnggaran.conference || 0) +
      (alokasiAnggaran.nutrition || 0);

    const totalPenggunaan =
      (penggunaan.penggunaanBook || 0) +
      (penggunaan.penggunaanConference || 0) +
      (penggunaan.penggunaanNutrition || 0);

    const saldoAwal = totalAlokasi;
    const saldoAkhir = totalAlokasi - totalPenggunaan;

    res.status(200).json({
      message: `Ringkasan anggaran pribadi tahun ${tahun}`,
      data: {
        periode: tahun,
        nama: anggaran.userId.nama,
        totalAlokasiAnggaran: totalAlokasi,
        totalPenggunaanAnggaran: totalPenggunaan,
        saldoRiilAwalPeriode: saldoAwal,
        saldoRiilAkhirPeriode: saldoAkhir,
        perKategori: {
          alokasi: alokasiAnggaran,
          penggunaan: {
            book: penggunaan.penggunaanBook || 0,
            conference: penggunaan.penggunaanConference || 0,
            nutrition: penggunaan.penggunaanNutrition || 0,
          },
          sisa: sisaAnggaran,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
