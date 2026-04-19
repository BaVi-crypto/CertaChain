const crypto = require('crypto');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1'); // isti algoritam kao Bitcoin

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.privateKey = this.keyPair.getPrivate('hex');
    this.publicKey = this.keyPair.getPublic('hex');
    this.address = this.generateAddress();
  }

  generateAddress() {
    return crypto
      .createHash('sha256')
      .update(this.publicKey)
      .digest('hex')
      .substring(0, 40); // 40 znakova kao Ethereum adresa
  }

  sign(data) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return this.keyPair.sign(hash).toDER('hex');
  }

  static verify(publicKey, signature, data) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    const key = ec.keyFromPublic(publicKey, 'hex');
    return key.verify(hash, signature);
  }
}

module.exports = Wallet;