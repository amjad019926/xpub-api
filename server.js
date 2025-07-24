import express from "express";
import cors from "cors";
import * as bip39 from "bip39";
import * as bip32 from "bip32";
import { Wallet as EthersWallet } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import TronWeb from "tronweb";
import { Keypair } from "@solana/web3.js";
import * as xrpl from "xrpl";

const app = express();
app.use(cors());
app.use(express.json());

const pathMap = {
  btc: "m/84'/0'/0'/0",
  eth: "m/44'/60'/0'/0",
  bnb: "m/44'/60'/0'/0",
  usdt: "m/44'/60'/0'/0",
  trx: "m/44'/195'/0'/0",
  sol: "m/44'/501'/0'/0",
  ltc: "m/84'/2'/0'/0",
  xrp: "m/44'/144'/0'/0"
};

app.post("/wallet", async (req, res) => {
  try {
    const { mnemonic, coin, index = 0 } = req.body;
    if (!bip39.validateMnemonic(mnemonic)) return res.status(400).json({ error: "Invalid mnemonic" });
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = pathMap[coin.toLowerCase()];
    if (!path) return res.status(400).json({ error: "Unsupported coin" });
    const child = root.derivePath(`${path}/${index}`);
    let address = "", xpub = "";

    switch (coin.toLowerCase()) {
      case "btc":
        address = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network: bitcoin.networks.bitcoin }).address;
        xpub = root.derivePath(path).neutered().toBase58();
        break;
      case "ltc":
        address = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network: bitcoin.networks.litecoin }).address;
        xpub = root.derivePath(path).neutered().toBase58();
        break;
      case "eth":
      case "bnb":
      case "usdt":
        const hdNode = EthersWallet.fromPhrase(mnemonic);
        const derivedNode = hdNode.derivePath(`${path}/${index}`);
        address = derivedNode.address;
        xpub = "N/A";
        break;
      case "trx":
        const tw = new TronWeb({ fullHost: "https://api.trongrid.io" });
        address = tw.address.fromPrivateKey(child.privateKey.toString("hex"));
        xpub = "N/A";
        break;
      case "sol":
        const kp = Keypair.fromSeed(child.privateKey.slice(0, 32));
        address = kp.publicKey.toBase58();
        xpub = "N/A";
        break;
      case "xrp":
        const xrplWallet = xrpl.Wallet.fromSeed(child.toWIF());
        address = xrplWallet.address;
        xpub = "N/A";
        break;
      default:
        return res.status(400).json({ error: "Unsupported coin" });
    }

    res.json({ coin, address, xpub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Multi-coin wallet API running on port 3000");
});
