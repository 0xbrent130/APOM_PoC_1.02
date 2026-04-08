// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProtocolErrors} from "../common/ProtocolErrors.sol";
import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";

contract EscrowVault is ProtocolErrors {
    address public immutable manager;
    mapping(bytes32 => mapping(address => uint256)) public escrowBalances;

    modifier onlyManager() {
        if (msg.sender != manager) revert Unauthorized();
        _;
    }

    constructor(address manager_) {
        if (manager_ == address(0)) revert InvalidAddress();
        manager = manager_;
    }

    function depositNative(bytes32 escrowId) external payable onlyManager {
        if (msg.value == 0) revert InvalidAmount();
        escrowBalances[escrowId][address(0)] += msg.value;
    }

    function recordTokenDeposit(bytes32 escrowId, address token, uint256 amount) external onlyManager {
        if (token == address(0) || amount == 0) revert InvalidAmount();
        escrowBalances[escrowId][token] += amount;
    }

    function payout(bytes32 escrowId, address token, address to, uint256 amount) external onlyManager {
        if (to == address(0) || amount == 0) revert InvalidAmount();
        uint256 balance = escrowBalances[escrowId][token];
        if (balance < amount) revert InvalidAmount();
        escrowBalances[escrowId][token] = balance - amount;

        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            bool sent = IERC20Minimal(token).transfer(to, amount);
            if (!sent) revert TransferFailed();
        }
    }
}
