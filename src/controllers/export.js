const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Remunerasi = require("../models/remunerasi");
const Anggaran = require("../models/anggaran");
const syncAnggaran = require("../helpers/syncAnggaran");

// Summary PDF
exports.exportSummaryAnggaranPDF = async (req, res) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    // Sync sebelum ambil summary
    await syncAnggaran("ALL", tahun);
    const anggaranList = await Anggaran.find({ periode: tahun });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=summary-anggaran-${tahun}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(`Ringkasan Anggaran Tahun ${tahun}`, {
      align: "center",
    });
    doc.moveDown();

    // Inisialisasi total
    let totalPenggunaan = { book: 0, conference: 0, nutrition: 0 };
    let totalSisa = { book: 0, conference: 0, nutrition: 0 };
    let totalAlokasi = { book: 0, conference: 0, nutrition: 0 };

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

    const totalAnggaran =
      totalAlokasi.book + totalAlokasi.conference + totalAlokasi.nutrition;
    const totalPenggunaanAll =
      totalPenggunaan.book +
      totalPenggunaan.conference +
      totalPenggunaan.nutrition;
    const saldoAwal = totalAnggaran;
    const saldoAkhir = totalAnggaran - totalPenggunaanAll;

    // Tulis ke PDF
    doc.fontSize(12).text(`Total Alokasi: Rp ${totalAnggaran}`);
    doc.text(`Total Penggunaan: Rp ${totalPenggunaanAll}`);
    doc.text(`Saldo Awal: Rp ${saldoAwal}`);
    doc.text(`Saldo Akhir: Rp ${saldoAkhir}`);
    doc.moveDown();

    doc.text("Detail per kategori:");
    doc.text(
      `- Book: Alokasi Rp${totalAlokasi.book}, Penggunaan Rp${totalPenggunaan.book}, Sisa Rp${totalSisa.book}`
    );
    doc.text(
      `- Conference: Alokasi Rp${totalAlokasi.conference}, Penggunaan Rp${totalPenggunaan.conference}, Sisa Rp${totalSisa.conference}`
    );
    doc.text(
      `- Nutrition: Alokasi Rp${totalAlokasi.nutrition}, Penggunaan Rp${totalPenggunaan.nutrition}, Sisa Rp${totalSisa.nutrition}`
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal export summary anggaran PDF" });
  }
};

// Summary Excel
exports.exportSummaryAnggaranExcel = async (req, res) => {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    await syncAnggaran("ALL", tahun);
    const anggaranList = await Anggaran.find({ periode: tahun });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Summary ${tahun}`);

    sheet.columns = [
      { header: "Kategori", key: "kategori", width: 20 },
      { header: "Alokasi", key: "alokasi", width: 20 },
      { header: "Penggunaan", key: "penggunaan", width: 20 },
      { header: "Sisa", key: "sisa", width: 20 },
    ];

    let totalPenggunaan = { book: 0, conference: 0, nutrition: 0 };
    let totalSisa = { book: 0, conference: 0, nutrition: 0 };
    let totalAlokasi = { book: 0, conference: 0, nutrition: 0 };

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

    sheet.addRow({
      kategori: "Book",
      alokasi: totalAlokasi.book,
      penggunaan: totalPenggunaan.book,
      sisa: totalSisa.book,
    });
    sheet.addRow({
      kategori: "Conference",
      alokasi: totalAlokasi.conference,
      penggunaan: totalPenggunaan.conference,
      sisa: totalSisa.conference,
    });
    sheet.addRow({
      kategori: "Nutrition",
      alokasi: totalAlokasi.nutrition,
      penggunaan: totalPenggunaan.nutrition,
      sisa: totalSisa.nutrition,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=summary-anggaran-${tahun}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal export summary anggaran Excel" });
  }
};

// Remunerasi PDF
exports.exportRemunerasiPDF = async (req, res) => {
  try {
    let periode = req.query.periode || new Date().getFullYear();

    periode = parseInt(periode, 10);
    if (isNaN(periode)) {
      return res.status(400).json({ message: "Periode harus berupa angka" });
    }

    const remunerasiList = await Remunerasi.find({ periode }).populate(
      "pemohon",
      "nama email"
    );

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=remunerasi-${periode}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(`Laporan Remunerasi Tahun ${periode}`, {
      align: "center",
    });
    doc.moveDown();

    remunerasiList.forEach((item, i) => {
      const formattedDate = new Date(item.tanggalPembelian).toLocaleDateString(
        "id-ID",
        { day: "2-digit", month: "short" }
      );

      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${formattedDate} | ${item.nama} - Rp${item.jumlah} | ${
            item.jenis
          } | ${item.pemohon?.nama}`
        );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal export remunerasi PDF" });
  }
};

// Remunerasi Excel
exports.exportRemunerasiExcel = async (req, res) => {
  try {
    let periode = req.query.periode || new Date().getFullYear();
    periode = parseInt(periode, 10);
    if (isNaN(periode)) {
      return res.status(400).json({ message: "Periode harus berupa angka" });
    }

    const remunerasiList = await Remunerasi.find({ periode }).populate(
      "pemohon",
      "nama email"
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Remunerasi ${periode}`);

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal Pembelian", key: "tanggalPembelian", width: 10 },
      { header: "Nama Produk", key: "produk", width: 25 },
      { header: "Harga", key: "harga", width: 15 },
      { header: "Kategori", key: "kategori", width: 20 },
      { header: "Pemohon", key: "pemohon", width: 25 },
      { header: "Email Pemohon", key: "email", width: 25 },
    ];

    remunerasiList.forEach((item, i) => {
      sheet.addRow({
        no: i + 1,
        tanggalPembelian: item.tanggalPembelian,
        produk: item.nama,
        harga: item.jumlah,
        kategori: item.jenis,
        pemohon: item.pemohon?.nama,
        email: item.pemohon?.email,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=remunerasi-${periode}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal export remunerasi Excel" });
  }
};
