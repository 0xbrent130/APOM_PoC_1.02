// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProductRegistry {
    struct Product {
        string externalId;
        string metadataHash;
        address owner;
        uint256 createdAt;
    }

    mapping(bytes32 => Product) private products;

    event ProductRegistered(
        bytes32 indexed productKey,
        string externalId,
        string metadataHash,
        address indexed owner,
        uint256 createdAt
    );

    function registerProduct(
        string calldata externalId,
        string calldata metadataHash
    ) external returns (bytes32 productKey) {
        require(bytes(externalId).length > 0, "External ID required");
        require(bytes(metadataHash).length > 0, "Metadata hash required");

        productKey = keccak256(abi.encodePacked(externalId));
        require(products[productKey].createdAt == 0, "Product already exists");

        products[productKey] = Product({
            externalId: externalId,
            metadataHash: metadataHash,
            owner: msg.sender,
            createdAt: block.timestamp
        });

        emit ProductRegistered(
            productKey,
            externalId,
            metadataHash,
            msg.sender,
            block.timestamp
        );
    }

    function getProduct(bytes32 productKey) external view returns (Product memory) {
        require(products[productKey].createdAt != 0, "Product not found");
        return products[productKey];
    }
}
