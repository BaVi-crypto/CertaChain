const crypto = require('crypto');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.hash = this.calculateHash();
    this.signature = null;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress +
              this.amount + this.timestamp)
      .digest('hex');
  }

  sign(wallet) {
    if (wallet.address !== this.fromAddress) {
      throw new Error('Cannot sign a transaction for another wallet!');
    }
    this.signature = wallet.sign({
      hash: this.hash,
      from: this.fromAddress,
      to: this.toAddress,
      amount: this.amount
    });
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature) {
      throw new Error('Transaction has no signature!');
    }

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        hash: this.hash,
        from: this.fromAddress,
        to: this.toAddress,
        amount: this.amount
      }))
      .digest('hex');

    const key = ec.keyFromPublic(this.fromAddress, 'hex');
    return key.verify(hash, this.signature);
  }
}

module.exports = Transaction;