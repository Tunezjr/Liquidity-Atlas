import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.PROTOTYPE_URL ?? "http://127.0.0.1:4173";
const output = process.env.SCREENSHOT_PATH ?? "public/screenshots/prototype.png";

await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.log(`Saved ${output}`);
