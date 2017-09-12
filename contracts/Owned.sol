pragma solidity 0.4.15;

contract Owned {
    address public owner;

    // initialize owner

    function Owned () {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function kill() {
        selfdestruct(owner);
    }
}
