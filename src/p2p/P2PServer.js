const WebSocket = require('ws');

const MESSAGE_TYPE = {
  CHAIN: 'CHAIN',
  TRANSACTION: 'TRANSACTION',
  REQUEST_CHAIN: 'REQUEST_CHAIN',
  REQUEST_PENDING: 'REQUEST_PENDING',
  PENDING: 'PENDING'
};

class P2PServer {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.peers = [];
    this.sockets = [];
  }

  // Start P2P server
  listen(port) {
    const server = new WebSocket.Server({ port });
    server.on('connection', socket => this.connectSocket(socket));
    console.log(`P2P server running on port ${port}`);
  }

  // Connect to a peer
  connectToPeer(peerAddress) {
    const socket = new WebSocket(peerAddress);
    socket.on('open', () => {
      this.connectSocket(socket);
      console.log(`Connected to peer: ${peerAddress}`);
    });
    socket.on('error', err => {
      console.log(`Peer connection failed: ${peerAddress}`);
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    this.messageHandler(socket);
    this.sendChain(socket);
    console.log(`New peer connected. Total peers: ${this.sockets.length}`);
  }

  messageHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);

      switch (data.type) {
        case MESSAGE_TYPE.CHAIN:
          this.handleChainMessage(data.payload);
          break;
        case MESSAGE_TYPE.TRANSACTION:
          this.handleTransactionMessage(data.payload);
          break;
        case MESSAGE_TYPE.REQUEST_CHAIN:
          this.sendChain(socket);
          break;
        case MESSAGE_TYPE.REQUEST_PENDING:
          this.sendPending(socket);
          break;
        case MESSAGE_TYPE.PENDING:
          this.handlePendingMessage(data.payload);
          break;
      }
    });

    socket.on('close', () => {
      this.sockets = this.sockets.filter(s => s !== socket);
      console.log(`Peer disconnected. Total peers: ${this.sockets.length}`);
    });
  }

  // Sync chain — prihvati duži lanac
  handleChainMessage(receivedChain) {
    if (receivedChain.length <= this.blockchain.chain.length) return;

    console.log(`Received longer chain (${receivedChain.length} blocks). Syncing...`);
    this.blockchain.chain = receivedChain;
    this.broadcastChain();
  }

  handleTransactionMessage(transaction) {
    const exists = this.blockchain.pendingTransactions
      .find(tx => tx.hash === transaction.hash);
    if (!exists) {
      this.blockchain.pendingTransactions.push(transaction);
      console.log(`New transaction received: ${transaction.hash.substring(0, 12)}...`);
    }
  }

  handlePendingMessage(pending) {
    pending.forEach(tx => this.handleTransactionMessage(tx));
  }

  // Send methods
  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPE.CHAIN,
      payload: this.blockchain.chain
    }));
  }

  sendPending(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPE.PENDING,
      payload: this.blockchain.pendingTransactions
    }));
  }

  // Broadcast to all peers
  broadcastChain() {
    this.sockets.forEach(socket => this.sendChain(socket));
    console.log(`Chain broadcasted to ${this.sockets.length} peers`);
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach(socket => {
      socket.send(JSON.stringify({
        type: MESSAGE_TYPE.TRANSACTION,
        payload: transaction
      }));
    });
  }

  getPeerCount() {
    return this.sockets.length;
  }
}

module.exports = P2PServer;