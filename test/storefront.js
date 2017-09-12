var Storefront = artifacts.require("./Storefront.sol");

const Promise = require('bluebird');
Promise.promisifyAll(web3.eth, {suffix: "Promise"});
Promise.promisifyAll(web3.version, {suffix: "Promise"});

const expectException = require("../utils/expectedException.js").expectedExceptionPromise;
const expectThrow = require("../utils/expectedException.js").expectThrow;


contract('Storefront', function(accounts) {
  var owner = accounts[0];
  var user = accounts[1];
  var storefront;

  before("", function() {
  });

  beforeEach(function() {
    return Storefront.new({from: owner})
      .then(instance => {
        storefront = instance;
      });
  });

  // intialization tests
  it("should be owned by the owner", function() {
    return storefront.owner({from: owner})
      .then(_owner => {
        assert.strictEqual(_owner, owner, "Contract is not owned by owner");
      })
  });

  // deposit
  it("should let you deposit", function() {
    return storefront.deposit({from: owner, value: 5})
      .then(txObject => {
        return storefront.balance.call();
      })
      .then(_balance => {
        assert.strictEqual(_balance.toNumber(), 5, "Balance is wrong");
      });
  });

  // product management
  describe("add product tests", function() {
    var product = {id: 1, price: 15, quantity: 10};

    it("should add a product", function() {
      return storefront.addProduct(product.id, product.price, product.quantity, {from: owner})
        .then(txObject => {
          return storefront.products.call(product.id);
        })
        .then(_product => {
          var [_id, _price, _quantity] = _product;
          // console.log(product);
          assert.strictEqual(_id.toNumber(), product.id, "Product ID is wrong");
          assert.strictEqual(_price.toNumber(), product.price, "Price is wrong");
          assert.strictEqual(_quantity.toNumber(), product.quantity, "Quantity is wrong");
          return storefront.productExists.call(product.id);
        })
        .then(exists => {
          assert.strictEqual(exists, true, "Product is not marked as existing");
        });
    });

    it("should only let the owner add a product", async function() {
      await expectThrow(
        storefront.addProduct(product.id, product.price, product.quantity, {from: user})
      );
    });

    it("should fail if you try to add a product with zero quantity", async function() {
      await expectThrow(storefront.addProduct(product.id, product.price, 0, {from: owner}));
    });
  });

  describe("tests with existing product", function() {
    var product = {id: 1, price: 15, quantity: 1};

    beforeEach(function() {
      return storefront.addProduct(product.id, product.price, product.quantity);
    });

    it("should not be able to add an existing product", async function() {
      await expectThrow(storefront.addProduct(product.id, product.price, product.quantity,
        {from: owner})
      );
    });

    it("should be able to add stock", function() {
      let toAdd = 5;
      return storefront.addStock(product.id, toAdd, {from: owner})
        .then(txObject => {
          return storefront.products.call(product.id);
        })
        .then(_product => {
          assert.strictEqual(_product[2].toNumber(), product.quantity + toAdd, "Product quantity is wrong");
        });
    });

    it("should only let the owner add stock", async function() {
      await expectThrow(storefront.addStock(product.id, 5, {from: user}));
    });

    it("should not be able to add zero stock", async function() {
      await expectThrow(storefront.addStock(product.id, 0, {from: owner}));
    });

    // buy products
    it("should let a user buy a product", function() {
      return storefront.buyProduct(product.id, {from: user, value: product.price})
        .then(txObject => {
          return storefront.products.call(product.id);
        })
        .then(_product => {
          let quantity = _product[2];
          assert.strictEqual(quantity.toNumber(), product.quantity - 1, "Quantity left is wrong")
          return storefront.balance.call();
        })
        .then(_balance => {
          assert.strictEqual(_balance.toNumber(), product.price, "Balance is wrong after buy");
        });
    });

    it("should require exact change to buy", async function() {
      await expectThrow(
        storefront.buyProduct(product.id, {from: user, value: product.price + 1})
      );
    })

    it("should not be able to buy with zero product left", async function() {
      await storefront.buyProduct(product.id, {from: user, value: product.price});
      await expectThrow(
        storefront.buyProduct(product.id, {from: user, value: product.price})
      );
    });

  });


  describe("withdrawal tests", function() {
    var initialBalance = 100;
    var withdrawalAmount = 20;

    beforeEach(function() {
      return storefront.deposit({from: owner, value: initialBalance});
    });

    // TODO: owner's balance should increase
    it("should let the owner withdraw", function() {
      return storefront.withdraw(withdrawalAmount, {from: owner})
        .then(() => {
          return storefront.balance.call({from: owner});
        })
        .then(_balance => {
          assert.strictEqual(_balance.toNumber(), initialBalance - withdrawalAmount);
        });
    })

    // it should not let you withdraw more than the balance
    it("should not be able to withdraw more than the balance", async function() {
      await expectThrow(storefront.withdraw(200, {from: owner}));
    });

    it("should not let non-owner withdraw", async function() {
      await expectThrow(storefront.withdraw(withdrawalAmount, {from: user}));
    });
  });


});
