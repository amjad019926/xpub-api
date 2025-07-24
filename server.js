// ✅ FIXED: ESM version
import express from 'express';
import { ethers } from 'ethers';

const app = express();
app.use(express.json());

app.post("/xpub", async (req, res) => {
  try {
    const { mnemonic } = req.body;
    if (!ethers.isValidMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const xpub = hdNode.neuter().extendedKey;
    res.json({ xpub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ xpub API running on port 3000"));
