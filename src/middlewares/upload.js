const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper fungsi disk storage generator
const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `file/${folder}`);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + file.originalname;
      cb(null, uniqueName);
    },
  });

// Filter untuk gambar
const imageFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa gambar (jpg/png/jpeg)!"), false);
  }
};

// Filter untuk PDF
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa PDF!"), false);
  }
};

// Upload multiple fields (gambar, buktiPembelian, proposal)
const uploadFields = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "gambar") cb(null, "file/images");
      else if (file.fieldname === "buktiPembelian") cb(null, "file/receipt");
      else if (file.fieldname === "proposal") cb(null, "file/proposal");
      else cb(new Error("Field tidak dikenali!"), false);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + file.originalname;
      cb(null, unique);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "gambar" || file.fieldname === "profile") {
      if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype))
        cb(null, true);
      else cb(new Error("File gambar harus jpg/png/jpeg!"), false);
    } else if (
      file.fieldname === "buktiPembelian" ||
      file.fieldname === "proposal"
    ) {
      if (file.mimetype === "application/pdf") cb(null, true);
      else cb(new Error("File harus berupa PDF!"), false);
    } else {
      cb(null, false);
    }
  },
}).fields([
  { name: "gambar", maxCount: 1 },
  { name: "buktiPembelian", maxCount: 1 },
  { name: "proposal", maxCount: 1 },
]);

// File Remover
const removeUploadedFiles = (filesObj) => {
  for (const key in filesObj) {
    const filePath = path.join(__dirname, "../..", filesObj[key][0].path);
    fs.unlink(filePath, (err) => {
      if (err) console.log("Failed to delete", filePath, "-", err.message);
    });
  }
};

module.exports = {
  uploadImage: multer({
    storage: createStorage("images"),
    fileFilter: imageFilter,
  }),
  uploadProfile: multer({
    storage: createStorage("profile"),
    fileFilter: imageFilter,
  }),
  uploadProposal: multer({
    storage: createStorage("proposal"),
    fileFilter: pdfFilter,
  }),
  uploadReceipt: multer({
    storage: createStorage("receipt"),
    fileFilter: pdfFilter,
  }),
  uploadFields, // tambahkan ini di bawah agar ikut diekspor
  removeUploadedFiles,
};
