const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Blockchain = require('../core/Blockchain');
const Transaction = require('../core/Transaction');
const Wallet = require('../crypto/Wallet');
const P2PServer = require('../p2p/P2PServer');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const P2P_PORT = process.env.P2P_PORT || 6001;
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

app.use(helmet());
app.use(cors());
app.use(express.json());

const cetraChain = new Blockchain();
const minerWallet = new Wallet();
const p2pServer = new P2PServer(cetraChain);

console.log(`Miner address: ${minerWallet.address.substring(0, 20)}...`);

// ── ROUTES ──────────────────────────────────────────

app.get('/chain', (req, res) => {
  res.json({ length: cetraChain.chain.length, chain: cetraChain.chain });
});

app.get('/balance/:address', (req, res) => {
  res.json({
    address: req.params.address,
    balance: cetraChain.getBalance(req.params.address)
  });
});

app.get('/pending', (req, res) => {
  res.json({
    count: cetraChain.pendingTransactions.length,
    transactions: cetraChain.pendingTransactions
  });
});

app.get('/peers', (req, res) => {
  res.json({ count: p2pServer.getPeerCount() });
});

app.get('/validate', (req, res) => {
  res.json({ valid: cetraChain.isChainValid() });
});

app.post('/wallet', (req, res) => {
  const wallet = new Wallet();
  res.json({
    address: wallet.address,
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey
  });
});

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
    p2pServer.broadcastTransaction(tx);

    res.json({ message: 'Transaction added!', transaction: tx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/mine', (req, res) => {
  const minerAddress = (req.body && req.body.minerAddress)
    ? req.body.minerAddress
    : minerWallet.address;
  const block = cetraChain.minePendingTransactions(minerAddress);
  p2pServer.broadcastChain();
  res.json({
    message: 'Block mined!',
    block,
    minerBalance: cetraChain.getBalance(minerAddress)
  });
});

app.post('/peers/connect', (req, res) => {
  const { peer } = req.body;
  if (!peer) return res.status(400).json({ error: 'Peer address required' });
  p2pServer.connectToPeer(peer);
  res.json({ message: `Connecting to peer: ${peer}` });
});

// ── START ────────────────────────────────────────────
app.listen(HTTP_PORT, () => {
  console.log(`CetraChain node running on http://localhost:${HTTP_PORT}`);
});

p2pServer.listen(P2P_PORT);

PEERS.forEach(peer => p2pServer.connectToPeer(peer));