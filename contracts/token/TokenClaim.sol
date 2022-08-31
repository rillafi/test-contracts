// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IDecimals {
    function decimals() external view returns (uint8);
}

contract TokenClaim is Ownable {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public taskClaimedTokens;
    address[] public interacted;

    address token;
    uint256 amountPerClaim;

    constructor(address _token, uint256 _amountPerClaim) {
        token = _token;
        amountPerClaim = _amountPerClaim * 10**IDecimals(token).decimals();
        _amountPerClaim;
    }

    function claimTokens() public {
        require(taskClaimedTokens[msg.sender] == 0, "Already claimed tokens");
        taskClaimedTokens[msg.sender] += amountPerClaim;
        IERC20(token).safeTransferFrom(owner(), msg.sender, amountPerClaim);
        interacted.push(msg.sender);
    }

    function getInteracted() public view returns (address[] memory) {
        return interacted;
    }
}
