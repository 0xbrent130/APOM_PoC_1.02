// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract ProtocolErrors {
    error Unauthorized();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidStatus();
    error InvalidDeadline();
    error AlreadyExists();
    error NotFound();
    error TransferFailed();
    error ProductInactive();
    error InvalidPaymentToken();
    error EscrowExpired();
    error NotEscrowParty();
}
