pragma solidity 0.4.18;

import "./Freezable.sol";

contract Remittance is Freezable {

    struct LockBox {
        uint fundsWaiting;
        bool invalidKey;
    }

    mapping(bytes32 => LockBox) public LockBoxCluster;
    address[] public recipientAddresses;

    event LogRemittance(address depositor, uint amount, uint _fundsWaiting);
    event LogClaim(address claimant, uint funds, bool _invalidKey);
   
    function Remittance() {}


    // for testing use!!
    function hashHelper(string _password, address _recipient)
        public
        pure
        returns(bytes32 hashedPassword)
    {    
        return keccak256(_password, _recipient);
    }    

    function sendRemittance(string _password, address _recipient)
        public
        onlyOwner
        payable
        freezeRay
        returns (bool success)
    {
        bytes32 key = keccak256(_password, _recipient);
        require(LockBoxCluster[key].invalidKey == false); 
        LockBoxCluster[key].fundsWaiting += msg.value;
        recipientAddresses.push(_recipient);
        LogRemittance(msg.sender, msg.value, LockBoxCluster[key].fundsWaiting);
        return true; 
    }

//this takes a _password, which is a concatenation of 2 passwords(Bob's & Carol's), done client-side.
    function claimRemittance(string _password)
        public
        freezeRay
        returns (bool success)
    { 
        bytes32 key = keccak256(_password, msg.sender);
        require(LockBoxCluster[key].fundsWaiting != 0);
        LockBoxCluster[key].invalidKey = true;
        uint funds = LockBoxCluster[key].fundsWaiting;
        LockBoxCluster[key].fundsWaiting = 0;
        msg.sender.transfer(funds);
        LogClaim(msg.sender, funds, LockBoxCluster[key].invalidKey);
        return true;
    }
}