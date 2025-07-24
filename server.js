// server.js import express from "express"; import { ethers } from "ethers"; import hdkey from "ethereumjs-wallet/hdkey"; import * as bip39 from "bip39"; import * as bip32 from "bip32"; import cors from "cors";

const app = express(); app.use(express.json()); app.use(cors());

app.post("/address", async (req, res) => { try { const { mnemonic, coin, index } = req.body; const pathMap = { btc: "m/84'/0'/0'/0", eth: "m/44'/60'/0'/0", bnb: "m/44'/714'/0'/0", trx: "m/44'/195'/0'/0", sol: "m/44'/501'/0'/0" };

if (!bip39.validateMnemonic(mnemonic)) {
  return res.status(400).json({ error: "Invalid mnemonic" });
}

const seed = await bip39.mnemonicToSeed(mnemonic);
const root = bip32.fromSeed(seed);
const path = pathMap[coin] || pathMap.eth;
const child = root.derivePath(`${path}/${index || 0}`);

let address;
switch (coin) {
  case "btc": {
    const { payments } = await import("bitcoinjs-lib");
    const { address: addr } = payments.p2wpkh({ pubkey: child.publicKey });
    address = addr;
    break;
  }
  case "eth":
  case "bnb": {
    const wallet = new ethers.Wallet(child.privateKey);
    address = wallet.address;
    break;
  }
  case "trx": {
    const TronWeb = (await import("tronweb")).default;
    const tw = new TronWeb({
      fullHost: "https://api.trongrid.io"
    });
    address = tw.address.fromPrivateKey(child.privateKey.toString("hex"));
    break;
  }
  case "sol": {
    const { Keypair } = await import("@solana/web3.js");
    const kp = Keypair.fromSeed(child.privateKey.slice(0, 32));
    address = kp.publicKey.toBase58();
    break;
  }
}

const xpub = root.derivePath(path).neutered().toBase58();
res.json({ coin, xpub, address });

} catch (e) { res.status(500).json({ error: e.message }); } });

app.listen(3000, () => console.log("✅ Server running on port 3000"));

