// server.js const express = require("express"); const { ethers } = require("ethers"); const bip39 = require("bip39"); const hdkey = require("ethereumjs-wallet/hdkey"); const bitcoin = require("bitcoinjs-lib"); const tronWeb = require("tronweb"); const bs58check = require("bs58check");

const app = express(); app.use(express.json());

const getWallet = async (mnemonic, coin) => { const seed = await bip39.mnemonicToSeed(mnemonic);

switch (coin.toLowerCase()) { case "eth": case "bnb": { const hdwallet = hdkey.fromMasterSeed(seed); const path = "m/44'/60'/0'/0/0"; const wallet = hdwallet.derivePath(path).getWallet(); const address = 0x${wallet.getAddress().toString("hex")}; const node = ethers.HDNodeWallet.fromPhrase(mnemonic); const xpub = node.neuter().extendedKey; return { address, xpub }; }

case "btc": {
  const network = bitcoin.networks.bitcoin;
  const root = bitcoin.bip32.fromSeed(seed, network);
  const child = root.derivePath("m/84'/0'/0'");
  const xpub = child.neutered().toBase58();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.derive(0).derive(0).publicKey,
    network,
  });
  return { address, xpub };
}

case "ltc": {
  const network = bitcoin.networks.litecoin;
  const root = bitcoin.bip32.fromSeed(seed, network);
  const child = root.derivePath("m/84'/2'/0'");
  const xpub = child.neutered().toBase58();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.derive(0).derive(0).publicKey,
    network,
  });
  return { address, xpub };
}

case "trx": {
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const privateKey = node.derivePath("m/44'/195'/0'/0/0").privateKey;
  const tronAddr = tronWeb.address.fromPrivateKey(privateKey);
  return { address: tronAddr, xpub: "N/A for TRX" };
}

case "sol": {
  const ed25519 = require("ed25519-hd-key");
  const bs58 = require("bs58");
  const solanaWeb3 = require("@solana/web3.js");
  const derived = ed25519.derivePath("m/44'/501'/0'/0'", seed);
  const keypair = solanaWeb3.Keypair.fromSeed(derived.key);
  return {
    address: keypair.publicKey.toBase58(),
    xpub: "N/A for SOL",
  };
}

default:
  throw new Error("Unsupported coin");

} };

app.post("/wallet", async (req, res) => { const { mnemonic, coin } = req.body; try { if (!bip39.validateMnemonic(mnemonic)) { return res.status(400).json({ error: "Invalid mnemonic" }); } const result = await getWallet(mnemonic, coin); res.json(result); } catch (err) { res.status(500).json({ error: err.message }); } });

app.listen(3000, () => console.log("✅ Multi-coin wallet API running on port 3000"));

                                             
