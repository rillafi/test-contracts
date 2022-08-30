// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Swap {
    // global declarations
    using SafeERC20 for IERC20;
    IERC20 swapFromAsset;
    IERC20 swapToAsset;
    address owner;
    event Swapped(address from, uint256 amount);

    constructor(IERC20 _swapFromAsset, IERC20 _swapToAsset) {
        swapFromAsset = _swapFromAsset;
        swapToAsset = _swapToAsset;
        owner = msg.sender;
    }

    function swap(address from, uint256 amount) public {
        swapFromAsset.safeTransferFrom(msg.sender, owner, amount);
        swapToAsset.safeTransferFrom(owner, msg.sender, amount);
        emit Swapped(from, amount);
    }
}
