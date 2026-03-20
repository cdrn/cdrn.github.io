import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const { PINATA_JWT } = process.env;
const siteDir = process.argv[2] || "_site";

if (!PINATA_JWT) {
  console.error("Missing PINATA_JWT env var");
  process.exit(1);
}

// Recursively collect all files
function getFiles(dir, base) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, base));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(siteDir, siteDir);
console.log(`Pinning ${files.length} files from ${siteDir}/`);

// Build multipart form data
const formData = new FormData();
for (const filePath of files) {
  const relPath = relative(siteDir, filePath);
  const content = readFileSync(filePath);
  const blob = new Blob([content]);
  formData.append("file", blob, `site/${relPath}`);
}

// Pin metadata
formData.append("pinataMetadata", JSON.stringify({ name: "cdrn.xyz" }));

const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
  method: "POST",
  headers: { Authorization: `Bearer ${PINATA_JWT}` },
  body: formData,
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Pinata error ${response.status}: ${text}`);
  process.exit(1);
}

const data = await response.json();
console.log(`Pinned: ${data.IpfsHash}`);
console.log(`Browse: https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`);

// Output for GitHub Actions
const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  const { appendFileSync } = await import("fs");
  appendFileSync(ghOutput, `CID=${data.IpfsHash}\n`);
  appendFileSync(ghOutput, `pinned=true\n`);
}
