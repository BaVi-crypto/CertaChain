const Block = require('../src/core/Block');
const Blockchain = require('../src/core/Blockchain');

test('Block ispravno računa hash', () => {
  const block = new Block(0, 12345, { test: 'data' }, '0');
  expect(block.hash).toBeDefined();
  expect(block.hash).toHaveLength(64);
});

test('Genesis blok postoji', () => {
  const chain = new Blockchain();
  expect(chain.chain).toHaveLength(1);
  expect(chain.chain[0].index).toBe(0);
});

test('Dodavanje bloka radi ispravno', () => {
  const chain = new Blockchain();
  chain.addBlock({ natjecatelj: 'Test' });
  expect(chain.chain).toHaveLength(2);
  expect(chain.chain[1].previousHash).toBe(chain.chain[0].hash);
});

test('Lanac je valjan', () => {
  const chain = new Blockchain();
  chain.addBlock({ natjecatelj: 'Ana' });
  chain.addBlock({ natjecatelj: 'Marko' });
  expect(chain.isChainValid()).toBe(true);
});

test('Manipulacija lanca se detektira', () => {
  const chain = new Blockchain();
  chain.addBlock({ natjecatelj: 'Ana' });
  chain.chain[1].data = { natjecatelj: 'HAKER' };
  expect(chain.isChainValid()).toBe(false);
});