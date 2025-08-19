const isKaryawan = (req, res, next) => {
  if (!req.user || req.user.role !== "karyawan") {
    return res.status(403).json({ message: "Forbidden: Karyawan only" });
  }

  next();
};

module.exports = isKaryawan;
