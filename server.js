const express = require("express");
const bip39 = require("bip39");
const bip32 = require("bip32");
const bs58 = require("bs58");
const ed25519 = require("ed25519-hd-key");
const nacl = require("tweetnacl");
const { Connection, Keypair } = require("@solana/web3.js");
const TronWeb = require("tronweb");

const app = express();
app.use(express.json());

const derivationPaths = {
  btc: `m/44'/0'/0'/0`,
  eth: `m/44'/60'/0'/0`,
  bnb: `m/44'/714'/0'/0`,
  ltc: `m/44'/2'/0'/0`,
  trx: `m/44'/195'/0'/0`,
  sol: `m/44'/501'/0'/0'`,
};

app.post("/xpub", async (req, res) => {
  try {
    const { mnemonic, coin } = req.body;

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);

    if (coin === "sol") {
      const { key } = ed25519.derivePath(derivationPaths[coin], seed.toString("hex"));
      const keypair = nacl.sign.keyPair.fromSeed(key);
      const solKey = bs58.encode(Buffer.from(keypair.publicKey));
      return res.json({ coin, xpub: solKey });
    }

    if (coin === "trx") {
      const tronweb = TronWeb({ fullHost: "https://api.trongrid.io" });
      const node = bip32.fromSeed(seed);
      const child = node.derivePath(derivationPaths[coin]);
      const pk = child.privateKey.toString("hex");
      const address = tronweb.address.fromPrivateKey(pk);
      return res.json({ coin, xpub: address });
    }

    const root = bip32.fromSeed(seed);
    const child = root.derivePath(derivationPaths[coin]);
    const xpub = child.neutered().toBase58();
    res.json({ coin, xpub });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Multi-coin xpub API running on port 3000");
});
