const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Blockchain = require('../core/Blockchain');
const Transaction = require('../core/Transaction');
const Wallet = require('../crypto/Wallet');

const app = express();
const PORT = 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// CetraChain instance
const cetraChain = new Blockchain();
const minerWallet = new Wallet();

console.log('Miner address:', minerWallet.address.substring(0, 20) + '...');

// ── ROUTES ──────────────────────────────────────────

// GET /chain — cijeli blockchain
app.get('/chain', (req, res) => {
  res.json({
    length: cetraChain.chain.length,
    chain: cetraChain.chain
  });
});

// GET /balance/:address — stanje walletа
app.get('/balance/:address', (req, res) => {
  const balance = cetraChain.getBalance(req.params.address);
  res.json({
    address: req.params.address,
    balance
  });
});

// GET /pending — pending transakcije
app.get('/pending', (req, res) => {
  res.json({
    count: cetraChain.pendingTransactions.length,
    transactions: cetraChain.pendingTransactions
  });
});

// POST /wallet — napravi novi wallet
app.post('/wallet', (req, res) => {
  const wallet = new Wallet();
  res.json({
    address: wallet.address,
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey
  });
});

// POST /transaction — pošalji CetraCoins
app.post('/transaction', (req, res) => {
  const { fromAddress, toAddress, amount, privateKey } = req.body;

  if (!fromAddress || !toAddress || !amount || !privateKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const EC = require('elliptic').ec;
    const ec = new EC('secp256k1');

    const wallet = new Wallet();
    wallet.keyPair = ec.keyFromPrivate(privateKey, 'hex');
    wallet.privateKey = privateKey;
    wallet.publicKey = wallet.keyPair.getPublic().encode('hex', false);
    wallet.address = wallet.publicKey;

    const tx = new Transaction(fromAddress, toAddress, amount);
    tx.sign(wallet);
    cetraChain.addTransaction(tx);

    res.json({ message: 'Transaction added!', transaction: tx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /mine — rudari novi blok
app.post('/mine', (req, res) => {
  const block = cetraChain.minePendingTransactions(minerWallet.address);
  res.json({
    message: 'Block mined!',
    block,
    minerBalance: cetraChain.getBalance(minerWallet.address)
  });
});

// GET /validate — provjeri je li lanac valjan
app.get('/validate', (req, res) => {
  res.json({
    valid: cetraChain.isChainValid()
  });
});

// ── START ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CetraChain node running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /chain`);
  console.log(`  GET  /balance/:address`);
  console.log(`  GET  /pending`);
  console.log(`  GET  /validate`);
  console.log(`  POST /wallet`);
  console.log(`  POST /transaction`);
  console.log(`  POST /mine`);
});