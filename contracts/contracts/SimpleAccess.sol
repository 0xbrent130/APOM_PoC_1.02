// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleAccess {
    address public owner;
    mapping(address => bool) public admins;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AdminUpdated(address indexed admin, bool enabled);

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
    }

    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || admins[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function setAdmin(address admin, bool enabled) external onlyOwner {
        require(admin != address(0), "Invalid admin");
        admins[admin] = enabled;
        emit AdminUpdated(admin, enabled);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
