import express from "express";
import { adminSeedRouter } from "./routes/adminSeed.js";

const app = express();

app.use(express.json({ limit: "5mb" }));

app.use("/admin", adminSeedRouter);

const port = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 3002;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
