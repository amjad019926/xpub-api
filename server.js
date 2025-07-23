const express = require("express");
const bip39 = require("bip39");
const bip32 = require("bip32");
const bs58 = require("bs58");
const { derivePath } = require("ed25519-hd-key");
const nacl = require("tweetnacl");
const TronWeb = require("tronweb");
const { Keypair } = require("@solana/web3.js");

const app = express();
app.use(express.json());

// Paths per blockchain
const derivationPaths = {
  btc: "m/44'/0'/0'",
  eth: "m/44'/60'/0'",
  bnb: "m/44'/714'/0'",
  ltc: "m/44'/2'/0'",
};

app.post("/xpub", async (req, res) => {
  try {
    const { mnemonic, coin } = req.body;
    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }

    const coinType = coin.toLowerCase();
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    if (coinType === "sol") {
      const derived = derivePath("m/44'/501'/0'/0'", seed);
      const keypair = Keypair.fromSeed(derived.key);
      return res.json({
        coin: "solana",
        address: keypair.publicKey.toBase58(),
      });
    }

    if (coinType === "trx") {
      const derived = derivePath("m/44'/195'/0'/0/0", seed);
      const kp = nacl.sign.keyPair.fromSeed(derived.key);
      const address = TronWeb.address.fromPrivateKey(Buffer.from(kp.secretKey).toString("hex"));
      return res.json({
        coin: "tron",
        address: address,
      });
    }

    const path = derivationPaths[coinType];
    if (!path) {
      return res.status(400).json({ error: "Unsupported coin" });
    }

    const node = bip32.fromSeed(seed).derivePath(path);
    const xpub = node.neutered().toBase58();

    return res.json({
      coin: coinType,
      xpub: xpub,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("✅ Multi-coin xpub API running on port 3000"));
