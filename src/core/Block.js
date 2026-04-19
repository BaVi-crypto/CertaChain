const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.timestamp + 
              JSON.stringify(this.data) + 
              this.previousHash + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Blok izrudaren! Nonce: ${this.nonce} | Hash: ${this.hash}`);
  }

  toString() {
    return `Block #${this.index} [${this.hash.substring(0, 12)}...]`;
  }
}

module.exports = Block;