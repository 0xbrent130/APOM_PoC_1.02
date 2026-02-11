// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RoleAccess} from "../access/RoleAccess.sol";
import {ProtocolTypes} from "../common/ProtocolTypes.sol";
import {IProductRegistry} from "../interfaces/IProductRegistry.sol";

contract ProductRegistryV2 is RoleAccess, IProductRegistry {
    uint256 private nextProductId = 1;

    mapping(uint256 => ProtocolTypes.Product) private products;
    mapping(bytes32 => uint256) public productIdByExternalHash;

    function createProduct(
        string calldata externalId,
        string calldata metadataHash,
        address acceptedToken,
        uint256 unitPrice
    ) external returns (uint256 productId) {
        if (bytes(externalId).length == 0 || bytes(metadataHash).length == 0) revert InvalidAmount();
        if (unitPrice == 0) revert InvalidAmount();

        bytes32 externalHash = keccak256(abi.encodePacked(externalId));
        if (productIdByExternalHash[externalHash] != 0) revert AlreadyExists();

        productId = nextProductId++;
        products[productId] = ProtocolTypes.Product({
            id: productId,
            externalId: externalId,
            metadataHash: metadataHash,
            owner: msg.sender,
            acceptedToken: acceptedToken,
            unitPrice: unitPrice,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        productIdByExternalHash[externalHash] = productId;

        emit ProductCreated(productId, externalId, msg.sender, acceptedToken, unitPrice);
    }

    function updateProduct(
        uint256 productId,
        string calldata metadataHash,
        address acceptedToken,
        uint256 unitPrice,
        bool active
    ) external {
        ProtocolTypes.Product storage product = products[productId];
        if (product.id == 0) revert NotFound();
        if (product.owner != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        if (bytes(metadataHash).length == 0 || unitPrice == 0) revert InvalidAmount();

        product.metadataHash = metadataHash;
        product.acceptedToken = acceptedToken;
        product.unitPrice = unitPrice;
        product.active = active;
        product.updatedAt = block.timestamp;

        emit ProductUpdated(productId, metadataHash, acceptedToken, unitPrice, active);
    }

    function transferProductOwnership(uint256 productId, address newOwner) external {
        if (newOwner == address(0)) revert InvalidAddress();
        ProtocolTypes.Product storage product = products[productId];
        if (product.id == 0) revert NotFound();
        if (product.owner != msg.sender && !hasRole(SELLER_MANAGER_ROLE, msg.sender)) revert Unauthorized();

        address previousOwner = product.owner;
        product.owner = newOwner;
        product.updatedAt = block.timestamp;
        emit ProductOwnershipTransferred(productId, previousOwner, newOwner);
    }

    function getProduct(uint256 productId) external view returns (ProtocolTypes.Product memory) {
        ProtocolTypes.Product memory product = products[productId];
        if (product.id == 0) revert NotFound();
        return product;
    }

    function productExists(uint256 productId) external view returns (bool) {
        return products[productId].id != 0;
    }
}
