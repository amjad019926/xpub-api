const express = require("express");
const bip39 = require("bip39");
const bip32 = require("bip32");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

const paths = {
  bnb: "m/44'/60'/0'/0", // BNB Smart Chain = ETH derivation
};

app.post("/xpub", async (req, res) => {
  try {
    const { mnemonic, coin } = req.body;
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);
    const child = root.derivePath(paths[coin]);
    const xpub = child.neutered().toBase58();
    res.json({ coin, xpub });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/address", async (req, res) => {
  try {
    const { mnemonic, coin, index } = req.body;
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = `${paths[coin]}/${index || 0}`;
    const child = root.derivePath(path);
    const wallet = new ethers.Wallet(child.privateKey);
    res.json({ coin, address: wallet.address });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("✅ API running on port 3000");
});
