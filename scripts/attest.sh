#!/usr/bin/env bash
# Provenance attestation for blog posts.
#
# Usage:
#   scripts/attest.sh <post-slug>               # hash + OTS stamp + print statement to sign
#   scripts/attest.sh <post-slug> <signature>   # verify signature + write attestation.txt
#
# Flow: run without a signature first; sign the printed statement (EIP-191
# personal_sign) with the blog signing key; run again with the signature.
# Re-run after meaningful edits - the hash binds to the current revision.
#
# Needs: node (ethers in node_modules), and `ots` (opentimestamps-client) on
# PATH for stamping - `pipx install opentimestamps-client` or a venv.

set -euo pipefail
cd "$(dirname "$0")/.."

SIGNER="***REMOVED***"
SLUG="${1:?usage: attest.sh <post-slug> [signature]}"
SIG="${2:-}"

DIR="content/blog/$SLUG"
MD=$(find "$DIR" -maxdepth 1 -name "*.md" | head -1)
[ -n "$MD" ] || { echo "no markdown in $DIR" >&2; exit 1; }

export MD SLUG SIG SIGNER

if [ -z "$SIG" ]; then
  if command -v ots >/dev/null 2>&1; then
    ots stamp "$MD" || true
  else
    echo "warning: ots not on PATH, skipping timestamp (install opentimestamps-client)" >&2
  fi
  node -e '
    const fs = require("fs"), matter = require("gray-matter");
    const raw = fs.readFileSync(process.env.MD);
    const fm = matter(raw.toString());
    const hash = require("crypto").createHash("sha256").update(raw).digest("hex");
    const date = fm.data.date instanceof Date ? fm.data.date.toISOString().slice(0,10) : String(fm.data.date).slice(0,10);
    const stmt = `I am the author of "${fm.data.title}" (https://cdrn.xyz/blog/${process.env.SLUG}/).\nsha256: ${hash}\nPublished ${date}. - cdrn / cdrn.xyz`;
    console.log("Sign this statement (EIP-191 personal_sign), then re-run with the signature:\n");
    console.log(stmt);
    console.log("\nhex: 0x" + Buffer.from(stmt, "utf8").toString("hex"));
  '
else
  node -e '
    const fs = require("fs"), path = require("path"), matter = require("gray-matter");
    const { verifyMessage } = require("ethers");
    const raw = fs.readFileSync(process.env.MD);
    const fm = matter(raw.toString());
    const hash = require("crypto").createHash("sha256").update(raw).digest("hex");
    const date = fm.data.date instanceof Date ? fm.data.date.toISOString().slice(0,10) : String(fm.data.date).slice(0,10);
    const stmt = `I am the author of "${fm.data.title}" (https://cdrn.xyz/blog/${process.env.SLUG}/).\nsha256: ${hash}\nPublished ${date}. - cdrn / cdrn.xyz`;
    const rec = verifyMessage(stmt, process.env.SIG);
    if (rec !== process.env.SIGNER) { console.error("signature does not recover to " + process.env.SIGNER + " (got " + rec + ")"); process.exit(1); }
    const mdName = path.basename(process.env.MD);
    const att = `Authorship attestation for "${fm.data.title}"\nhttps://cdrn.xyz/blog/${process.env.SLUG}/\n\nStatement (signed exactly as the lines between the markers, EIP-191 personal_sign):\n\n-----BEGIN STATEMENT-----\n${stmt}\n-----END STATEMENT-----\n\nSigner:    ${process.env.SIGNER}\nSignature: ${process.env.SIG}\n\nVerification:\n- The sha256 is of ${mdName} (the post markdown source, published alongside this attestation) as of the attestation date. Later edits change the hash; the attestation binds this revision.\n- The same hash is anchored into Bitcoin via OpenTimestamps: ${mdName}.ots (verify with ots verify).\n- The signature verifies with any EIP-191 personal_sign verifier (ethers verifyMessage, viem, cast wallet verify).\n`;
    fs.writeFileSync(path.join(path.dirname(process.env.MD), "attestation.txt"), att);
    console.log("attestation.txt written and verified for " + process.env.SLUG);
  '
fi
