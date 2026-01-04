// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract ProtocolEvents {
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event RoleUpdated(bytes32 indexed role, address indexed account, bool enabled);

    event ProductCreated(
        uint256 indexed productId,
        string externalId,
        address indexed owner,
        address acceptedToken,
        uint256 unitPrice
    );
    event ProductUpdated(
        uint256 indexed productId,
        string metadataHash,
        address acceptedToken,
        uint256 unitPrice,
        bool active
    );
    event ProductOwnershipTransferred(uint256 indexed productId, address indexed previousOwner, address indexed newOwner);

    event EscrowCreated(
        bytes32 indexed escrowId,
        uint256 indexed productId,
        address indexed buyer,
        address seller,
        address paymentToken,
        uint256 amount
    );
    event EscrowFunded(bytes32 indexed escrowId, address indexed payer, uint256 amount);
    event EscrowDelivered(bytes32 indexed escrowId);
    event EscrowCompleted(bytes32 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowDisputed(bytes32 indexed escrowId, address indexed raisedBy, string reason);
    event EscrowResolved(bytes32 indexed escrowId, uint256 sellerAmount, uint256 buyerAmount);
    event EscrowCancelled(bytes32 indexed escrowId);
}
