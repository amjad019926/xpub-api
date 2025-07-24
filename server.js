import express from "express";
import cors from "cors";
import * as bip39 from "bip39";
import * as bip32 from "bip32";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import TronWeb from "tronweb";
import { Keypair } from "@solana/web3.js";
import * as xrpl from "xrpl";
import TonWeb from "tonweb";

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
  xrp: "m/44'/144'/0'/0",
  ton: "m/44'/607'/0'/0"
};

app.post("/wallet", async (req, res) => {
  try {
    const { mnemonic, coin, index = 0 } = req.body;

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const path = pathMap[coin.toLowerCase()];
    if (!path) return res.status(400).json({ error: "Unsupported coin" });

    const root = bip32.fromSeed(seed);
    const child = root.derivePath(`${path}/${index}`);
    let address = "", xpub = "";

    switch (coin.toLowerCase()) {
      case "btc":
      case "ltc": {
        const network = coin === "ltc" ? bitcoin.networks.litecoin : bitcoin.networks.bitcoin;
        const node = bip32.fromSeed(seed, network);
        const childNode = node.derivePath(`${path}/${index}`);
        address = bitcoin.payments.p2wpkh({ pubkey: childNode.publicKey, network }).address;
        xpub = node.neutered().toBase58();
        break;
      }

      case "eth":
      case "bnb":
      case "usdt": {
        const wallet = new ethers.Wallet(child.privateKey);
        address = wallet.address;
        const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
        xpub = hdNode.neuter().extendedKey;
        break;
      }

      case "trx": {
        const tw = new TronWeb({ fullHost: "https://api.trongrid.io" });
        address = tw.address.fromPrivateKey(child.privateKey.toString("hex"));
        xpub = "N/A";
        break;
      }

      case "sol": {
        const kp = Keypair.fromSeed(child.privateKey.slice(0, 32));
        address = kp.publicKey.toBase58();
        xpub = "N/A";
        break;
      }

      case "xrp": {
        const wallet = xrpl.Wallet.fromSeed(xrpl.generateFaucetWallet().seed);
        address = wallet.address;
        xpub = "N/A";
        break;
      }

      case "ton": {
        const tonweb = new TonWeb();
        const keyPair = await tonweb.wallet.all.v3R2.keyPairFromSeed(child.privateKey);
        address = TonWeb.utils.publicKeyToAddress(keyPair.publicKey.toString("hex"));
        xpub = "N/A";
        break;
      }

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
