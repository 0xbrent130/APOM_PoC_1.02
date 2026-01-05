// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProtocolErrors} from "../common/ProtocolErrors.sol";
import {ProtocolEvents} from "../common/ProtocolEvents.sol";

contract RoleAccess is ProtocolErrors, ProtocolEvents {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant SELLER_MANAGER_ROLE = keccak256("SELLER_MANAGER_ROLE");

    address public owner;
    mapping(bytes32 => mapping(address => bool)) private roleMembers;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    modifier onlyOwnerOrRole(bytes32 role) {
        if (msg.sender != owner && !hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        roleMembers[ADMIN_ROLE][msg.sender] = true;
        emit OwnerTransferred(address(0), msg.sender);
        emit RoleUpdated(ADMIN_ROLE, msg.sender, true);
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roleMembers[role][account];
    }

    function setRole(bytes32 role, address account, bool enabled) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        roleMembers[role][account] = enabled;
        emit RoleUpdated(role, account, enabled);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address previousOwner = owner;
        owner = newOwner;
        roleMembers[ADMIN_ROLE][newOwner] = true;
        emit OwnerTransferred(previousOwner, newOwner);
        emit RoleUpdated(ADMIN_ROLE, newOwner, true);
    }
}
