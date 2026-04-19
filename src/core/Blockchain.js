const Block = require('./Block');
const Transaction = require('./Transaction');

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.miningReward = 50; // 50 CetraCoina po bloku — kao Bitcoin
    this.difficulty = 2;    // koliko nula mora biti na početku hasha
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Rudar potvrđuje transakcije i dobiva nagradu
  minePendingTransactions(minerAddress) {
    const rewardTx = new Transaction(null, minerAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transakcija mora imati adrese!');
    }
    if (!transaction.isValid()) {
      throw new Error('Nevažeća transakcija!');
    }
    if (transaction.amount <= 0) {
      throw new Error('Iznos mora biti pozitivan!');
    }
    if (transaction.amount > this.getBalance(transaction.fromAddress)) {
      throw new Error('Nedovoljno CetraCoina!');
    }
    this.pendingTransactions.push(transaction);
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.data) {
        if (tx.fromAddress === address) balance -= tx.amount;
        if (tx.toAddress === address) balance += tx.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (!current.data.every(tx => tx.isValid())) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

module.exports = Blockchain;