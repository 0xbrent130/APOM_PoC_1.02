// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProtocolTypes} from "../common/ProtocolTypes.sol";

interface IProductRegistry {
    function getProduct(uint256 productId) external view returns (ProtocolTypes.Product memory);
    function productExists(uint256 productId) external view returns (bool);
}
