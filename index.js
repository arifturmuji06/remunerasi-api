const express = require("express");

const app = express();

app.use(() => {
  console.log("hello server...");
  console.log("hello lagi");
  console.log("ini test lagi");
});

app.listen(4000);
