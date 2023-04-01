// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

//Get funds from users
// Withdraw funds
//Set a minimum funding value in USD

import "./PriceConverter.sol";

//"constant" and "immutable" keyword

// 794743 => 775021 with constant
// 2558 => 2558 "no difference after The Merge?"
// 2580 => 444 with immutable

error FundMe__NotOwner();

/**
 * @title A contract for crowd funding
 * @author Bob
 * @notice This contract is to demo a sample contract
 * @dev This implement price feed as our library
 */
contract FundMe {
    using PriceConverter for uint256; // use PriceConverter as a library for uint256 type so we can do var.getConversionRate()

    uint256 public constant MINIMUM_USD = 50 * 1e18; //type + visability + name. naming constant data with XXX_XX format
    mapping(address => uint256) private s_addressToAmountFunded;

    address[] private s_funders;

    address private immutable i_owner; //how you declare an immutable variable

    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //pass the address of the pricefeed to determine what
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @notice This function funds this contract
     */
    function fund() public payable {
        //want to be able to set a minimum fund amount is USD
        //1. How do we send ETH to this contract?
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); // 1e18 == 1 Ether in Wei
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
        //What is reverting? -- Undo any actions before and send remaining gas back
    }

    function withdraw() public onlyOwner {
        //for loop
        // [1, 2, 3, 4]
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        //reset the array
        s_funders = new address[](0);
        // actually withdraw the fund

        // three different ways to send ETH from a contract: transfer, send, call

        // msg.sender = address while payable(msg.sender) = payable address
        // address needs to be payable to send tokens to
        // payable(msg.sender).transfer(address(this).balance);

        // //send returns a boolean, if no require(), transaction will not revert
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // call, recommended way to send token. return two value, first boolean and second returnedData;
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Transfer failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // mapping can't be in memory!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Transfer failed");
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    // what happens if someone sends this contract without calling the fund function?
    // receive and fallback special functions
}
