pragma solidity 0.4.18;

import "./Freezable.sol";

contract Remittance is Freezable {

    // address public Carol;
    uint public fundsForBob;
    bytes32 public hashedPasswords;
    bool public fundsUnlocked;
    
    event LogRemittance(address depositor, uint amount);
    event LogClaim(address claimant, uint funds);

// needs hash match to access a box. this coul be a password, pin or combo
// hash generated from keccak256(address recipient, uint amount, uint8 pinNumber)

// recipient needs the right hash to enter, then the right address to access the funds

    struct LockBox {
        address recipient;
        uint fundsWaiting;
        bytes32 previousKey;
    }

    mapping(bytes32 => LockBox) public LockBoxCluster;
    address[] public recipientAddresses;

    function Remittance() {
        // Carol = _Carol;
    }

    // 1.)client-side function!
    // function passwordHasher(string _password)
    //     public
    //     pure
    //     returns(bytes32 hashedPassword)
    // {    
    //     return keccak256(_password);
    // }
    
    // 2.)passwords hashed client-side by passwordHasher()
    // function setPasswords(bytes32 _hashedPassword1, bytes32 _hashedPassword2)
    //     public
    //     freezeRay
    //     onlyOwner
    //     returns (bool success)
    // {
    //     hashedPasswords = keccak256(_hashedPassword1, _hashedPassword2);
    //     return true;
    // }    

    // key is the hash of 2 passwords, calculated client-side.
    function sendRemittance(bytes32 _Key, address _recipient)
        public
        onlyOwner
        payable
        freezeRay
        returns (bool success)
    {
        LockBoxCluster[_Key].recipient = _recipient;
        LockBoxCluster[_Key].fundsWaiting += msg.value;
        recipientAddresses.push(msg.sender);
        LogRemittance(msg.sender, msg.value); 
    }

    function claimRemittance(bytes32 _password)
        public
        freezeRay
        returns (bool success)
    { 
        // require(LockBoxCluster[_password].previousKey != _password);
        // LockBoxCluster[_password].previousKey = _password;
        require(msg.sender == LockBoxCluster[_password].recipient);
        require(LockBoxCluster[_password].fundsWaiting != 0);
        uint funds = LockBoxCluster[_password].fundsWaiting;
        LockBoxCluster[_password].fundsWaiting = 0;
        msg.sender.transfer(funds);
        LogClaim(msg.sender, msg.value);
    }

    // function changeKeys
 
    // function deposit()
    //     freezeRay
    //     onlyOwner
    //     public 
    //     payable 
    //     returns (bool success)
    // {  
    //     require(hashedPasswords != bytes32(0));
    //     require(msg.value != 0);
    //     fundsForBob += msg.value;
    //     LogDeposit(msg.sender, msg.value);
    //     return true;
    // }
    
    // function validatePasswords(bytes32 _hashedPassword1, bytes32 _hashedPassword2)
    //     public
    //     freezeRay
    //     returns (bool success)
    // {
    //     require(msg.sender == Carol);
    //     require(keccak256(_hashedPassword1, _hashedPassword2) == hashedPasswords);
    //     fundsUnlocked = true;
    //     return true; 
    // }

    // function withdrawFunds()
    //     public
    //     freezeRay
    //     returns (bool success)
    // {
    //     require(msg.sender == Carol);
    //     require(fundsUnlocked == true);
    //     require(fundsForBob != 0);
    //     uint amount = fundsForBob; 
    //     fundsForBob = 0;
    //     fundsUnlocked = false;
    //     LogWithdrawal(msg.sender, amount);
    //     msg.sender.transfer(amount);
    //     return true; 
    // }    
    
}