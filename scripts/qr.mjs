import QRCode from "qrcode";
import { mkdirSync } from "node:fs";
const url = process.env.SITE_URL || "https://wolfwdavid.github.io/captain-pikachu/";
mkdirSync("dist", { recursive: true });
await QRCode.toFile("dist/qr.png", url, { width: 720, margin: 2, color: { dark: "#1b1b1f", light: "#ffffff" } });
await QRCode.toFile("qr.png", url, { width: 720, margin: 2, color: { dark: "#1b1b1f", light: "#ffffff" } });
console.log("QR written for", url);
