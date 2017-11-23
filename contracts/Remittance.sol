pragma solidity 0.4.18;

import "./Freezable.sol";

contract Remittance is Freezable {

    address public Carol;
    uint public fundsForBob;
    bytes32 public hashedPasswords;
    bool public fundsUnlocked;
    
    event LogDeposit(address depositor, uint amount);
    event LogWithdrawal(address withdrawer, uint amount);
    
    function Remittance(address _Carol) {
        Carol = _Carol;
    }
    // 1.)client-side function!
    function passwordHasher(string _password)
        public
        pure
        returns(bytes32 hashedPassword)
    {    
        return keccak256(_password);
    }
    
    // 2.)passwords hashed client-side by passwordHasher()
    function setPasswords(bytes32 _hashedPassword1, bytes32 _hashedPassword2)
        public
        freezeRay
        onlyOwner
        returns (bool success)
    {
        hashedPasswords = keccak256(_hashedPassword1, _hashedPassword2);
        return true;
    }    
    
    function deposit()
        freezeRay
        onlyOwner
        public 
        payable 
        returns (bool success)
    {  
        require(hashedPasswords != bytes32(0));
        require(msg.value != 0);
        fundsForBob += msg.value;
        LogDeposit(msg.sender, msg.value);
        return true;
    }
    
    function validatePasswords(bytes32 _hashedPassword1, bytes32 _hashedPassword2)
        public
        freezeRay
        returns (bool success)
    {
        require(msg.sender == Carol);
        require(keccak256(_hashedPassword1, _hashedPassword2) == hashedPasswords);
        fundsUnlocked = true;
        return true; 
    }

    function withdrawFunds()
        public
        freezeRay
        returns (bool success)
    {
        require(msg.sender == Carol);
        require(fundsUnlocked == true);
        require(fundsForBob != 0);
        uint amount = fundsForBob; 
        fundsForBob = 0;
        fundsUnlocked = false;
        LogWithdrawal(msg.sender, amount);
        msg.sender.transfer(amount);
        return true; 
    }    
    
}