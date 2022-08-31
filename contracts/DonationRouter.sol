// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISwap} from "./interfaces/ISwap.sol";

contract DonationRouter is Ownable {
    using SafeERC20 for IERC20;
    address public charityAddress;
    address public feeAddress;
    uint256 public fee;
    ISwap public swapper;
    IERC20 public acceptedToken;
    uint256 public constant FEEDIVISOR = 10**18;

    mapping(address => uint256) public donatedAmount;
    mapping(address => bool) public taskDonateRillaUSDC;
    mapping(address => bool) public taskDonateTRilla;
    address[] public interacted;

    event Donate(address from, uint256 amount);

    constructor(
        address _charityAddress,
        address _feeAddress,
        uint256 _fee,
        ISwap _swapper,
        IERC20 _acceptedToken
    ) {
        charityAddress = _charityAddress;
        feeAddress = _feeAddress;
        fee = _fee;
        swapper = _swapper;
        acceptedToken = _acceptedToken;
    }

    /// @notice calculates and sends fees to both the fee address and charity addresses
    /// @dev implemented after all swaps are complete OR if the donating token is the same as acceptedToken
    function _donateAndChargeFees() internal {
        acceptedToken.safeTransfer(
            feeAddress,
            (acceptedToken.balanceOf(address(this)) * fee) / FEEDIVISOR
        );
        uint256 amount = acceptedToken.balanceOf(address(this));
        acceptedToken.safeTransfer(charityAddress, amount);
        donatedAmount[msg.sender] += amount;
        emit Donate(msg.sender, amount);
    }

    /// @notice Donate any ERC20 that has liquidity on the Dex integrated in this contract. Handles cases for all different tokens as well as the chain's native asset
    /// @param sellToken the address of the token being provided as donation
    /// @param sellAmount number of tokens being provided as donation
    /// @dev if donating with native asset (ETH) set sellToken to WETH's address, msg.value to desired Eth donation
    /// @dev if donating with acceptedToken then it's fine to send empty bytes to swapCallData ("0x")
    function donate(IERC20 sellToken, uint256 sellAmount) public {
        if (!taskDonateRillaUSDC[msg.sender] && !taskDonateTRilla[msg.sender]) {
            interacted.push(msg.sender);
        }
        if (sellToken == acceptedToken) {
            sellToken.safeTransferFrom(msg.sender, address(this), sellAmount);
            // assign task completion
            taskDonateRillaUSDC[msg.sender] = true;
            _donateAndChargeFees();
            return;
        }
        sellToken.safeTransferFrom(msg.sender, address(this), sellAmount);
        if (sellToken.allowance(address(this), address(swapper)) < sellAmount) {
            sellToken.safeApprove(address(swapper), type(uint256).max);
        }
        // execute swap
        swapper.swap(msg.sender, sellAmount);
        // assign task completion
        taskDonateTRilla[msg.sender] = true;
        // charge fees
        _donateAndChargeFees();
    }

    /// @notice Setter for fee variable
    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function getInteracted() public view returns (address[] memory) {
        return interacted;
    }
}
