// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OrderEscrow {
    enum Status {
        None,
        Funded,
        Released,
        Refunded
    }

    struct EscrowOrder {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
        uint256 createdAt;
    }

    mapping(bytes32 => EscrowOrder) public orders;
    address public owner;

    event OrderFunded(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event OrderReleased(bytes32 indexed orderId, address indexed seller, uint256 amount);
    event OrderRefunded(bytes32 indexed orderId, address indexed buyer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function fundOrder(bytes32 orderId, address seller) external payable {
        require(orderId != bytes32(0), "Invalid order ID");
        require(seller != address(0), "Invalid seller");
        require(msg.value > 0, "Amount required");

        EscrowOrder storage order = orders[orderId];
        require(order.status == Status.None, "Order already exists");

        orders[orderId] = EscrowOrder({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            status: Status.Funded,
            createdAt: block.timestamp
        });

        emit OrderFunded(orderId, msg.sender, seller, msg.value);
    }

    function releaseToSeller(bytes32 orderId) external {
        EscrowOrder storage order = orders[orderId];
        require(order.status == Status.Funded, "Order not funded");
        require(msg.sender == order.buyer || msg.sender == owner, "Not authorized");

        order.status = Status.Released;
        (bool success, ) = payable(order.seller).call{value: order.amount}("");
        require(success, "Transfer failed");

        emit OrderReleased(orderId, order.seller, order.amount);
    }

    function refundToBuyer(bytes32 orderId) external onlyOwner {
        EscrowOrder storage order = orders[orderId];
        require(order.status == Status.Funded, "Order not funded");

        order.status = Status.Refunded;
        (bool success, ) = payable(order.buyer).call{value: order.amount}("");
        require(success, "Refund failed");

        emit OrderRefunded(orderId, order.buyer, order.amount);
    }
}
