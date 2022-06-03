//SPXDX-LIicense-Indentifier: Unilicense
pragma solidity ^0.8.0;

contract Whitelist {

    // Max number of whitelisted addresses allowed
    uint8 public maxWhitelistedAddresses;

    // Create a mapping of whitlistedAddresses
    // if an address is whitelisted, we would set it to true, it is false by default for all other addresses
    mapping(address => bool) public whitelistedAddresses;

    //numAddressesWhitelisted would be used to keep track of how many addresses have been whitelisted
    // NOTE; Dont change this variable name, as it will be part of verification
    uint8 public numAddressesWhitelisted;

    // Setting the MAx number of whitelisted addresses
    // User will put the value at the time of deployment

    constructor(uint8 _maxWhitelistedAddresses) {
        maxWhitelistedAddresses = _maxWhitelistedAddresses;
    }

    /**
    addAddressToWhitelist - This function adds the address of the sender to the
        whitelist
    **/
    function addAddressToWhitelist() public {
        // check if user has alrdy been whitelisted
        require(!whitelistedAddresses[msg.sender], 'Sender has alrdy been whitelisted');
        // check if numAddressesWhitelisted < maxWhitelistedAddresses, if not throw an error
        require(numAddressesWhitelisted < maxWhitelistedAddresses, 'More addresses cannot be added, limit exceeded');
        // add address to whitelistedAddresses array
        whitelistedAddresses[msg.sender] = true;
        // increase number of whitelisted addresses
        numAddressesWhitelisted += 1;

    }
}