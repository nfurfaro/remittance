pragma solidity 0.4.18;

import "./Freezable.sol";

contract LockBox is Freezable {

    address public sponsor;

    struct LockedBox {
        uint fundsWaiting;
        bool deactivatedKey;
    }

    mapping(bytes32 => LockedBox) public LockBoxCluster;

    modifier onlySponsor() {
        require(msg.sender == sponsor);
        _;
    }

    event LogBoxCreated(address depositor, uint amount);
    event LogBoxOpened(address claimant, uint funds);
   
    function LockBox(address boxSponsor) {
        sponsor = boxSponsor;
    }


    //for testing use!!
    function hashHelper(address recipient, string password, uint pin)
        public
        pure
        returns(bytes32 hashedPassword)
    {    
        return keccak256(recipient, password, pin);
    }    

//password emailed to recipient, PIN # sent via sms.
    function sendToBox(bytes32 hashKey)
        public
        onlySponsor
        payable
        freezeRay
        returns (bool success)
    {
        require(msg.value != 0);
        require(LockBoxCluster[hashKey].deactivatedKey == false); 
        LockBoxCluster[hashKey].fundsWaiting += msg.value;
        LogBoxCreated(msg.sender, msg.value);
        return true; 
    }

    function openBox(string password, uint pin)
        public
        freezeRay
        returns (bool success)
    { 
        bytes32 key = keccak256(msg.sender, password, pin);
        require(LockBoxCluster[key].deactivatedKey == false);        
        require(LockBoxCluster[key].fundsWaiting != 0);
        LockBoxCluster[key].deactivatedKey = true;
        uint funds = LockBoxCluster[key].fundsWaiting;
        LockBoxCluster[key].fundsWaiting = 0;
        msg.sender.transfer(funds);
        LogBoxOpened(msg.sender, funds);
        return true;
    }
}