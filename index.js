require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const corsMiddleware = require("./src/middlewares/cors");

const app = express();

// Middleware
app.use(express.json());
app.use(corsMiddleware);

// Static file serving
app.use("/file/images", express.static(path.join(__dirname, "file/images")));
app.use("/file/profile", express.static(path.join(__dirname, "file/profile")));
app.use(
  "/file/proposal",
  express.static(path.join(__dirname, "file/proposal"))
);
app.use("/file/receipt", express.static(path.join(__dirname, "file/receipt")));

// Routes
app.use("/v1/remunerasi", require("./src/routes/remunerasi"));
app.use("/v1/auth", require("./src/routes/auth"));
app.use("/v1/users", require("./src/routes/user"));
app.use("/v1/anggaran", require("./src/routes/anggaran"));
app.use("/v1/upload", require("./src/routes/upload"));
app.use("/v1/export", require("./src/routes/export"));

// Global Error Handler
app.use((error, req, res, next) => {
  res.status(error.errorStatus || 500).json({
    message: error.message,
    data: error.data,
  });
});

// Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 4000, () =>
      console.log(`✅ Server running on port ${process.env.PORT || 4000}`)
    );
  })
  .catch((err) => console.log(err));
