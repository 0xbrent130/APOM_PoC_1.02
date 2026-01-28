// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ProtocolTypes {
    enum EscrowStatus {
        None,
        Created,
        Funded,
        Delivered,
        Completed,
        Disputed,
        Cancelled,
        Refunded
    }

    struct Product {
        uint256 id;
        string externalId;
        string metadataHash;
        address owner;
        address acceptedToken;
        uint256 unitPrice;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Escrow {
        bytes32 id;
        uint256 productId;
        address buyer;
        address seller;
        address paymentToken;
        uint256 amount;
        uint256 createdAt;
        uint256 deadline;
        uint256 disputeWindowEndsAt;
        EscrowStatus status;
    }
}
