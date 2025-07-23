const express = require("express");
const { HDNodeWallet } = require("ethers");

const app = express();
app.use(express.json());

app.post("/xpub", (req, res) => {
  try {
    const mnemonic = req.body.mnemonic;

    // Check if mnemonic is 12 or 24 words (simple validation)
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return res.status(400).json({ error: "Invalid mnemonic word count" });
    }

    const hdNode = HDNodeWallet.fromPhrase(mnemonic);
    const xpub = hdNode.neuter().extendedKey;

    res.json({ xpub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ xpub API running on port 3000"));
