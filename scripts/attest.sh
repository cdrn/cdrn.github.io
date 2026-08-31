#!/usr/bin/env bash
# Provenance attestation for blog posts.
#
# Usage:
#   scripts/attest.sh <post-slug>               # hash + OTS stamp + print statement to sign
#   scripts/attest.sh <post-slug> <signature>   # verify signature + write attestation.txt + archive revision
#
# Flow: run without a signature first; sign the printed statement (EIP-191
# personal_sign) with the blog signing key; run again with the signature.
#
# Revisions: every attested revision is archived under <post>/provenance/ as
# (<name>.<hash8>.md, <name>.<hash8>.md.ots, attestation.<hash8>.txt) - the
# pre-image, its Bitcoin timestamp, and its signed statement. Editing a post
# never destroys an earlier proof: the original .ots keeps its original stamp
# time, and the archived pre-image is what that stamp verifies against. The
# top-level attestation.txt / .md.ots always describe the live revision.
#
# Needs: node (ethers in node_modules), and `ots` (opentimestamps-client) on
# PATH for stamping - `pipx install opentimestamps-client` or a venv.

set -euo pipefail
cd "$(dirname "$0")/.."

SIGNER="0x34eb878aB45D2a0a7B37cF5728c50E23ac4AB7C1"
SLUG="${1:?usage: attest.sh <post-slug> [signature]}"
SIG="${2:-}"

DIR="content/blog/$SLUG"
MD=$(find "$DIR" -maxdepth 1 -name "*.md" | head -1)
[ -n "$MD" ] || { echo "no markdown in $DIR" >&2; exit 1; }

BASE=$(basename "$MD" .md)
NEWHASH=$(shasum -a 256 "$MD" | cut -d' ' -f1)
OLDHASH=""
[ -f "$DIR/attestation.txt" ] && OLDHASH=$(grep -o "sha256: [0-9a-f]*" "$DIR/attestation.txt" | head -1 | cut -d' ' -f2 || true)

export MD SLUG SIG SIGNER

if [ -z "$SIG" ]; then
  if [ -n "$OLDHASH" ] && [ "$OLDHASH" != "$NEWHASH" ] && [ -f "$MD.ots" ]; then
    # Edited since last attestation: the stale .ots stamps the OLD bytes.
    # Make sure that revision (pre-image + ots) is archived before replacing it.
    old8="${OLDHASH:0:8}"
    mkdir -p "$DIR/provenance"
    if [ ! -f "$DIR/provenance/$BASE.$old8.md.ots" ]; then
      cp "$MD.ots" "$DIR/provenance/$BASE.$old8.md.ots"
    fi
    if [ ! -f "$DIR/provenance/$BASE.$old8.md" ]; then
      git show "HEAD:$MD" > "$DIR/provenance/$BASE.$old8.md" 2>/dev/null || true
      arch_hash=$(shasum -a 256 "$DIR/provenance/$BASE.$old8.md" 2>/dev/null | cut -d' ' -f1 || true)
      if [ "$arch_hash" != "$OLDHASH" ]; then
        rm -f "$DIR/provenance/$BASE.$old8.md"
        echo "warning: could not recover pre-image for $old8 from git HEAD; recover it manually (git log) into $DIR/provenance/$BASE.$old8.md" >&2
      fi
    fi
    [ -f "$DIR/attestation.txt" ] && cp "$DIR/attestation.txt" "$DIR/provenance/attestation.$old8.txt" 2>/dev/null || true
    rm "$MD.ots"
  fi
  if [ -f "$MD.ots" ]; then
    echo "existing $MD.ots covers the current bytes - keeping its original stamp time" >&2
  elif command -v ots >/dev/null 2>&1; then
    ots stamp "$MD"
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
    const att = `Authorship attestation for "${fm.data.title}"\nhttps://cdrn.xyz/blog/${process.env.SLUG}/\n\nStatement (signed exactly as the lines between the markers, EIP-191 personal_sign):\n\n-----BEGIN STATEMENT-----\n${stmt}\n-----END STATEMENT-----\n\nSigner:    ${process.env.SIGNER}\nSignature: ${process.env.SIG}\n\nVerification:\n- The sha256 is of ${mdName} (the post markdown source, published alongside this attestation) as of the attestation date. Later edits change the hash; the attestation binds this revision.\n- The same hash is anchored into Bitcoin via OpenTimestamps: ${mdName}.ots (verify with ots verify).\n- Earlier attested revisions, if any, are archived under provenance/ in this directory: pre-image, .ots proof, and signed statement for each - the timestamp of the first revision is the priority claim.\n- The signature verifies with any EIP-191 personal_sign verifier (ethers verifyMessage, viem, cast wallet verify).\n`;
    fs.writeFileSync(path.join(path.dirname(process.env.MD), "attestation.txt"), att);
    console.log("attestation.txt written and verified for " + process.env.SLUG);
  '
  # Archive this attested revision: pre-image + timestamp proof + statement
  short8="${NEWHASH:0:8}"
  mkdir -p "$DIR/provenance"
  cp "$MD" "$DIR/provenance/$BASE.$short8.md"
  [ -f "$MD.ots" ] && cp "$MD.ots" "$DIR/provenance/$BASE.$short8.md.ots"
  cp "$DIR/attestation.txt" "$DIR/provenance/attestation.$short8.txt"
  echo "revision $short8 archived in $DIR/provenance/"
fi
