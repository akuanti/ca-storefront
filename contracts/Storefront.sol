pragma solidity 0.4.15;


import "./Owned.sol";

/*
The project will start as a database whereby:
- as an administrator, you can add products, which consist of an id, a price and a stock.
- as a regular user you can buy 1 of the products.
- as the owner you can make payments or withdraw value from the contract.

Eventually, you will refactor it to include:

- ability to remove products.
- co-purchase by different people.
- add merchants akin to what Amazon has become.
- add the ability to pay with a third-party token.
*/

contract Storefront is Owned {
    uint public balance;

    struct Product {
        uint id;
        uint price;
        uint quantity;
    }

    mapping (uint => Product) public products;
    mapping (uint => bool) public productExists;



    event LogDeposit(address sender, uint amount);
    event LogProductAdded(address sender, uint id, uint price, uint quantity);
    event LogStockAdded(address sender, uint id, uint quantity);
    event LogWithdrawal(address sender, address receiver, uint amount);
    event LogProductBought(address buyer, uint id, uint quantity);


    function Storefront () {}

    /// admin functions
    function deposit()
        public
        payable
        onlyOwner
    {
        balance += msg.value;
        LogDeposit(msg.sender, msg.value);
    }

    function addProduct(uint productId, uint price, uint quantity)
        public
        onlyOwner
    {
        require(quantity > 0);
        require(productExists[productId] == false);

        Product memory p = Product({
            id: productId,
            price: price,
            quantity: quantity
        });

        products[productId] = p;
        productExists[productId] = true;

        LogProductAdded(msg.sender, productId, price, quantity);
    }

    function addStock(uint productId, uint quantity)
        public
        onlyOwner
    {
        require(quantity > 0);
        require(productExists[productId]);

        products[productId].quantity += quantity;
        LogStockAdded(msg.sender, productId, quantity);

    }

    // set price?

    function withdraw(uint amount)
        public
        onlyOwner
    {
        // balance must be at least amount
        require(balance >= amount);

        balance -= amount;
        msg.sender.transfer(amount);

        LogWithdrawal(msg.sender, owner, amount);
    }


    /// user functions
    function buyProduct(uint id)
        public
        payable
    {
        // there needs to be enough product
        require(products[id].quantity > 0);

        // buyer needs to send exact change
        uint total = products[id].price;
        require(msg.value == total);

        // accounting
        balance += msg.value;
        products[id].quantity -= 1;

        LogProductBought(msg.sender, id, 1);
    }

}
