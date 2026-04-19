const crypto = require('crypto');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.privateKey = this.keyPair.getPrivate('hex');
    this.publicKey = this.keyPair.getPublic().encode('hex', false); // fix
    this.address = this.generateAddress();
  }

  generateAddress() {
  return this.publicKey; // adresa = public key direktno
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
    const key = ec.keyFromPublic(publicKey, 'hex'); // sad radi ispravno
    return key.verify(hash, signature);
  }
}

module.exports = Wallet;