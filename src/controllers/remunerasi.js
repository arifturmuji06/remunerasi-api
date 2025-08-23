const { validationResult } = require("express-validator");
const { removeUploadedFiles } = require("../middlewares/upload");
const path = require("path");
const fs = require("fs");
const Remunerasi = require("../models/remunerasi");
const syncAnggaran = require("../helpers/syncAnggaran");
const mongoose = require("mongoose");

exports.createRemunerasi = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    removeUploadedFiles(req.files);
    const err = new Error("Input value tidak sesuai!");
    err.errorStatus = 400;
    err.data = errors.array();
    throw err;
  }

  // Cek file wajib: gambar dan bukti pembelian
  if (!req.files || !req.files.gambar || !req.files.buktiPembelian) {
    removeUploadedFiles(req.files);
    const err = new Error("Gambar dan bukti pembelian harus diupload!");
    err.errorStatus = 422;
    throw err;
  }

  const {
    jenis,
    nama,
    jumlah,
    periode,
    tanggalPembelian,
    keterangan,
    userId, // tetap dikirim dari body
  } = req.body;

  const gambar = req.files.gambar[0].path.replace(/\\/g, "/");
  const buktiPembelian = req.files.buktiPembelian[0].path.replace(/\\/g, "/");

  // Kondisional: kalau Conference, wajib ada proposal
  let proposalPath = "";
  if (jenis === "Conference") {
    if (!req.files.proposal) {
      removeUploadedFiles(req.files);
      const err = new Error(
        "Proposal harus diupload untuk kategori Conference!"
      );
      err.errorStatus = 422;
      throw err;
    }
    proposalPath = req.files.proposal[0].path.replace(/\\/g, "/");
  }

  const Posting = new Remunerasi({
    jenis,
    nama,
    jumlah,
    periode,
    tanggalPembelian,
    gambar,
    buktiPembelian,
    proposal: proposalPath || null,
    keterangan,
    pemohon: userId,
  });

  Posting.save()
    .then(async (result) => {
      // Sync Anggaran otomatis
      await syncAnggaran(userId, periode);

      res.status(201).json({
        message: "Create Remunerasi Success!!!",
        data: result,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getAllRemunerasi = async (req, res, next) => {
  try {
    const { periode, userId } = req.query;

    const filter = {};
    if (periode) {
      filter.periode = periode;
    }
    if (userId) {
      filter.pemohon = userId;
    }

    const data = await Remunerasi.find(filter).populate(
      "pemohon",
      "nama email"
    );

    res.status(200).json({
      message: "List semua remunerasi",
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyRemunerasi = async (req, res, next) => {
  try {
    const { periode } = req.query;
    const userId = req.user.userId;

    const filter = { pemohon: userId };
    if (periode) {
      filter.periode = periode;
    }

    const myRemunerasi = await Remunerasi.find(filter).populate(
      "pemohon",
      "nama email"
    );

    res.status(200).json({
      message: "Data remunerasi milik user ditemukan",
      data: myRemunerasi,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRemunerasiById = (req, res, next) => {
  const remunId = req.params.remunId;
  Remunerasi.findById(remunId)
    .populate("pemohon", "userId nama")
    .then((result) => {
      if (!result) {
        const error = new Error("Data Remunerasi tidak ditemukan!");
        error.errorStatus = 404;
        throw error;
      }
      res.status(200).json({
        message: "Data Remunerasi berhasil dipanggil!!!",
        data: result,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.updateRemunerasiById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      removeUploadedFiles(req.files);
      const err = new Error("Input value tidak sesuai!");
      err.errorStatus = 400;
      err.data = errors.array();
      throw err;
    }

    const remunId = req.params.remunId;
    const existing = await Remunerasi.findById(remunId);

    if (!existing) {
      removeUploadedFiles(req.files);
      const err = new Error("Data Remunerasi tidak ditemukan!");
      err.errorStatus = 404;
      throw err;
    }

    const allowedFields = [
      "jenis",
      "nama",
      "jumlah",
      "periode",
      "tanggalPembelian",
      "keterangan",
      "userId",
    ];

    const dataToUpdate = {};

    const unsetFields = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        if (field === "userId") {
          dataToUpdate.pemohon = req.body.userId;
        } else {
          dataToUpdate[field] = req.body[field];
        }
      }
    });

    const oldFilesToDelete = [];

    // Replace gambar
    if (req.files?.gambar) {
      const newGambar = req.files.gambar[0].path.replace(/\\/g, "/");
      if (existing.gambar) oldFilesToDelete.push(existing.gambar);
      dataToUpdate.gambar = newGambar;
    }

    // Replace buktiPembelian
    if (req.files?.buktiPembelian) {
      const newReceipt = req.files.buktiPembelian[0].path.replace(/\\/g, "/");
      if (existing.buktiPembelian)
        oldFilesToDelete.push(existing.buktiPembelian);
      dataToUpdate.buktiPembelian = newReceipt;
    }

    // Conditional: Proposal khusus Conference
    const jenisFinal = dataToUpdate.jenis || existing.jenis;
    if (jenisFinal === "Conference") {
      const hasProposal = req.files?.proposal || existing.proposal;
      if (!hasProposal) {
        removeUploadedFiles(req.files); // hanya hapus file yang baru diupload
        const err = new Error(
          "Proposal harus diupload untuk kategori Conference!"
        );
        err.errorStatus = 422;
        throw err;
      }
      if (req.files?.proposal) {
        const newProposal = req.files.proposal[0].path.replace(/\\/g, "/");
        if (existing.proposal) oldFilesToDelete.push(existing.proposal);
        dataToUpdate.proposal = newProposal;
      }
    } else {
      if (existing.proposal) oldFilesToDelete.push(existing.proposal);
      unsetFields.proposal = "";
    }

    // Merge $unset if needed
    const finalUpdate = Object.keys(unsetFields).length
      ? { ...dataToUpdate, $unset: unsetFields }
      : dataToUpdate;

    const updated = await Remunerasi.findByIdAndUpdate(remunId, finalUpdate, {
      new: true,
    });

    oldFilesToDelete.forEach((filePath) => removeImage(filePath));

    res.status(200).json({
      message: "Update Remunerasi Success!!!",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteRemunerasi = (req, res, next) => {
  const remunId = req.params.remunId;
  Remunerasi.findById(remunId)
    .then((remun) => {
      if (!remun) {
        const error = new Error("Data Remunerasi tidak ditemukan!");
        error.errorStatus = 404;
        throw error;
      }

      removeImage(remun.gambar);
      return Remunerasi.findByIdAndDelete(remunId);
    })
    .then((result) => {
      res.status(200).json({
        message: "Data Remunerasi berhasil dihapus!!!",
        data: result,
      });
    })
    .catch((err) => {
      next(err);
    });
};

const removeImage = (filePath) => {
  filePath = path.join(__dirname, "../..", filePath);
  fs.unlink(filePath, (err) => err);
};
