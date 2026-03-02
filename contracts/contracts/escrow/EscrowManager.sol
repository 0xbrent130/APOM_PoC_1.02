// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RoleAccess} from "../access/RoleAccess.sol";
import {ProtocolTypes} from "../common/ProtocolTypes.sol";
import {IProductRegistry} from "../interfaces/IProductRegistry.sol";
import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";
import {EscrowVault} from "./EscrowVault.sol";

contract EscrowManager is RoleAccess {
    uint256 public constant MIN_DEADLINE_DURATION = 1 hours;
    uint256 public constant MAX_DEADLINE_DURATION = 30 days;
    uint256 public constant DEFAULT_DISPUTE_WINDOW = 48 hours;

    IProductRegistry public immutable productRegistry;
    EscrowVault public immutable vault;

    mapping(bytes32 => ProtocolTypes.Escrow) public escrows;

    constructor(address registryAddress) {
        if (registryAddress == address(0)) revert InvalidAddress();
        productRegistry = IProductRegistry(registryAddress);
        vault = new EscrowVault(address(this));
    }

    function createEscrow(
        uint256 productId,
        address seller,
        address paymentToken,
        uint256 amount,
        uint256 deadline
    ) external returns (bytes32 escrowId) {
        if (seller == address(0) || amount == 0) revert InvalidAmount();
        if (!productRegistry.productExists(productId)) revert NotFound();
        if (deadline <= block.timestamp + MIN_DEADLINE_DURATION) revert InvalidDeadline();
        if (deadline > block.timestamp + MAX_DEADLINE_DURATION) revert InvalidDeadline();

        ProtocolTypes.Product memory product = productRegistry.getProduct(productId);
        if (!product.active) revert ProductInactive();
        if (product.acceptedToken != paymentToken) revert InvalidPaymentToken();

        escrowId = keccak256(
            abi.encodePacked(block.chainid, productId, msg.sender, seller, paymentToken, amount, block.timestamp)
        );
        if (escrows[escrowId].status != ProtocolTypes.EscrowStatus.None) revert AlreadyExists();

        escrows[escrowId] = ProtocolTypes.Escrow({
            id: escrowId,
            productId: productId,
            buyer: msg.sender,
            seller: seller,
            paymentToken: paymentToken,
            amount: amount,
            createdAt: block.timestamp,
            deadline: deadline,
            disputeWindowEndsAt: 0,
            status: ProtocolTypes.EscrowStatus.Created
        });

        emit EscrowCreated(escrowId, productId, msg.sender, seller, paymentToken, amount);
    }

    function fundEscrow(bytes32 escrowId) external payable {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Created) revert InvalidStatus();
        if (escrow.buyer != msg.sender) revert Unauthorized();
        if (block.timestamp > escrow.deadline) revert EscrowExpired();

        if (escrow.paymentToken == address(0)) {
            if (msg.value != escrow.amount) revert InvalidAmount();
            vault.depositNative{value: msg.value}(escrowId);
        } else {
            if (msg.value != 0) revert InvalidAmount();
            bool received = IERC20Minimal(escrow.paymentToken).transferFrom(msg.sender, address(vault), escrow.amount);
            if (!received) revert TransferFailed();
            vault.recordTokenDeposit(escrowId, escrow.paymentToken, escrow.amount);
        }

        escrow.status = ProtocolTypes.EscrowStatus.Funded;
        emit EscrowFunded(escrowId, msg.sender, escrow.amount);
    }

    function markDelivered(bytes32 escrowId) external {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Funded) revert InvalidStatus();
        if (escrow.seller != msg.sender) revert Unauthorized();
        if (block.timestamp > escrow.deadline) revert EscrowExpired();

        escrow.status = ProtocolTypes.EscrowStatus.Delivered;
        escrow.disputeWindowEndsAt = block.timestamp + DEFAULT_DISPUTE_WINDOW;
        emit EscrowDelivered(escrowId);
    }

    function confirmAndRelease(bytes32 escrowId) external {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Delivered) revert InvalidStatus();
        if (escrow.buyer != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();

        _completeEscrow(escrowId, escrow);
    }

    function autoReleaseAfterWindow(bytes32 escrowId) external {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Delivered) revert InvalidStatus();
        if (escrow.disputeWindowEndsAt == 0 || block.timestamp < escrow.disputeWindowEndsAt) revert InvalidStatus();

        _completeEscrow(escrowId, escrow);
    }

    function raiseDispute(bytes32 escrowId, string calldata reason) external {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Delivered && escrow.status != ProtocolTypes.EscrowStatus.Funded) {
            revert InvalidStatus();
        }
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert NotEscrowParty();

        escrow.status = ProtocolTypes.EscrowStatus.Disputed;
        emit EscrowDisputed(escrowId, msg.sender, reason);
    }

    function resolveDispute(bytes32 escrowId, uint16 sellerShareBps) external onlyRole(ARBITER_ROLE) {
        if (sellerShareBps > 10000) revert InvalidAmount();

        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Disputed) revert InvalidStatus();

        uint256 sellerAmount = (escrow.amount * sellerShareBps) / 10000;
        uint256 buyerAmount = escrow.amount - sellerAmount;

        if (sellerAmount > 0) {
            vault.payout(escrowId, escrow.paymentToken, escrow.seller, sellerAmount);
        }
        if (buyerAmount > 0) {
            vault.payout(escrowId, escrow.paymentToken, escrow.buyer, buyerAmount);
        }

        escrow.status = ProtocolTypes.EscrowStatus.Completed;
        emit EscrowResolved(escrowId, sellerAmount, buyerAmount);
    }

    function cancelUnfundedEscrow(bytes32 escrowId) external {
        ProtocolTypes.Escrow storage escrow = escrows[escrowId];
        if (escrow.status != ProtocolTypes.EscrowStatus.Created) revert InvalidStatus();
        if (escrow.buyer != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();

        escrow.status = ProtocolTypes.EscrowStatus.Cancelled;
        emit EscrowCancelled(escrowId);
    }

    function _completeEscrow(bytes32 escrowId, ProtocolTypes.Escrow storage escrow) internal {
        escrow.status = ProtocolTypes.EscrowStatus.Completed;
        vault.payout(escrowId, escrow.paymentToken, escrow.seller, escrow.amount);
        emit EscrowCompleted(escrowId, escrow.seller, escrow.amount);
    }
}
