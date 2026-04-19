const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const content = this.index + this.timestamp + 
                    JSON.stringify(this.data) + this.previousHash;
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  toString() {
    return `Block #${this.index} [${this.hash.substring(0, 12)}...]`;
  }
}

module.exports = Block;