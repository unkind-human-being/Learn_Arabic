/** Run from your Next.js project root: node scripts/check-level1-assets.mjs */
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const names = ["child", "cap", "shirt", "pants", "socks", "shoes", "bag"];
const folder = path.join(process.cwd(), "public", "assets", "child wearing");
let missing = 0;
for (const name of names) {
  const filename = path.join(folder, `${name}.png`);
  try {
    await access(filename, constants.R_OK);
    console.log(`OK       ${name}.png`);
  } catch {
    missing += 1;
    console.error(`MISSING  ${filename}`);
  }
}
if (missing) {
  console.error(`\n${missing} image(s) missing. Keep the folder name "child wearing" with its space.`);
  console.error("Run this command from the project root, not from the scripts folder.");
  process.exitCode = 1;
} else {
  console.log("\nPASS: all seven Level 1 PNG assets are readable.");
}
