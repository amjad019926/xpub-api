const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

app.post("/xpub", (req, res) => {
  try {
    const mnemonic = req.body.mnemonic;

    if (!ethers.utils.HDNode.isValidMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }

    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const xpub = hdNode.neuter().extendedKey;

    res.json({ xpub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ xpub API running on port 3000"));
