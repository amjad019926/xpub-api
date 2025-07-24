import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as bip32 from "bip32";

const app = express();
app.use(cors());
app.use(express.json());

const getWallet = async (mnemonic, coin, index = 0) => {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }

  const pathMap = {
    btc: "m/84'/0'/0'/0",
    eth: "m/44'/60'/0'/0",
    bnb: "m/44'/714'/0'/0",
    ltc: "m/84'/2'/0'/0",
    trx: "m/44'/195'/0'/0",
    sol: "m/44'/501'/0'/0"
  };

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);
  const path = pathMap[coin] || pathMap.eth;
  const child = root.derivePath(`${path}/${index}`);

  let address = "";
  let xpub = "Not Supported";

  switch (coin) {
    case "btc":
    case "ltc": {
      const { payments, networks } = await import("bitcoinjs-lib");
      const network = coin === "ltc" ? networks.litecoin : networks.bitcoin;
      const { address: addr } = payments.p2wpkh({ pubkey: child.publicKey, network });
      address = addr;
      xpub = root.derivePath(path).neutered().toBase58();
      break;
    }

    case "eth":
    case "bnb": {
      const wallet = new ethers.Wallet(child.privateKey);
      address = wallet.address;
      const node = ethers.HDNodeWallet.fromPhrase(mnemonic);
      xpub = node.neuter().extendedKey;
      break;
    }

    case "trx": {
      const TronWeb = (await import("tronweb")).default;
      const tw = new TronWeb({ fullHost: "https://api.trongrid.io" });
      address = tw.address.fromPrivateKey(child.privateKey.toString("hex"));
      break;
    }

    case "sol": {
      const { Keypair } = await import("@solana/web3.js");
      const kp = Keypair.fromSeed(child.privateKey.slice(0, 32));
      address = kp.publicKey.toBase58();
      break;
    }

    default:
      throw new Error("Unsupported coin");
  }

  return { coin, xpub, address };
};

app.post("/wallet", async (req, res) => {
  const { mnemonic, coin, index } = req.body;

  try {
    const result = await getWallet(mnemonic, coin.toLowerCase(), index || 0);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ Multi-coin xpub+address API running on port 3000"));
