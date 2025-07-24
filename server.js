// server.js import express from "express"; import { ethers } from "ethers"; import hdkey from "ethereumjs-wallet/hdkey"; import * as bip39 from "bip39"; import * as bip32 from "bip32"; import cors from "cors";

const app = express(); app.use(express.json()); app.use(cors());

const getWallet = async (mnemonic, coin) => { if (!bip39.validateMnemonic(mnemonic)) { throw new Error("Invalid mnemonic"); }

const pathMap = { btc: "m/84'/0'/0'/0", ltc: "m/84'/2'/0'/0", eth: "m/44'/60'/0'/0", bnb: "m/44'/714'/0'/0", trx: "m/44'/195'/0'/0", sol: "m/44'/501'/0'/0" };

const seed = await bip39.mnemonicToSeed(mnemonic); const root = bip32.fromSeed(seed); const path = pathMap[coin] || pathMap.eth; const child = root.derivePath(${path}/0); let address = null; let xpub = null;

switch (coin) { case "btc": { const { payments, networks } = await import("bitcoinjs-lib"); const { address: addr } = payments.p2wpkh({ pubkey: child.publicKey, network: networks.bitcoin }); address = addr; xpub = root.derivePath(path).neutered().toBase58(); break; } case "ltc": { const { payments, networks } = await import("bitcoinjs-lib"); const litecoin = networks.litecoin || { messagePrefix: '\x19Litecoin Signed Message:\n', bech32: 'ltc', bip32: { public: 0x019da462, private: 0x019d9cfe }, pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0 }; const { address: addr } = payments.p2wpkh({ pubkey: child.publicKey, network: litecoin }); address = addr; xpub = root.derivePath(path).neutered().toBase58(); break; } case "eth": case "bnb": { const wallet = new ethers.Wallet(child.privateKey); address = wallet.address; xpub = root.derivePath(path).neutered().toBase58(); break; } case "trx": { const TronWeb = (await import("tronweb")).default; const tw = new TronWeb({ fullHost: "https://api.trongrid.io" }); address = tw.address.fromPrivateKey(child.privateKey.toString("hex")); xpub = "N/A for TRX"; break; } case "sol": { const { Keypair } = await import("@solana/web3.js"); const kp = Keypair.fromSeed(child.privateKey.slice(0, 32)); address = kp.publicKey.toBase58(); xpub = "N/A for SOL"; break; } default: throw new Error("Unsupported coin"); }

return { address, xpub }; };

app.post("/wallet", async (req, res) => { const { mnemonic, coin } = req.body; try { const result = await getWallet(mnemonic, coin); res.json(result); } catch (err) { res.status(500).json({ error: err.message }); } });

app.listen(3000,

           
