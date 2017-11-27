pragma solidity ^0.4.18;

import "./LockBox.sol";


contract Hub is Freezable {
    
    address[] public lockboxes;
    mapping(address => bool) lockBoxExists;

    modifier onlyIfBox(address _lockBox) {
        require(lockBoxExists[_lockBox] == true);
        _;
    }

    event LogNewBox(address sender, address lockBox, address sponsor);
    event LogFreezeSwitchState(address switcher, address lockBox, bool switchSetting);
    event LogChangeOwner(address changer, address lockBox, address newOwner);

    function Hub() {}

    function getLockBoxCount()
        public
        constant
        returns (uint lockBoxCount)
    {
        return lockboxes.length;
    }    

    function newLockBox(address boxSponsor)
        public
        returns (address lockBoxContract)
    {
        LockBox trustedLockBox = new LockBox(boxSponsor);
        lockboxes.push(trustedLockBox);
        lockBoxExists[trustedLockBox] = true;
        LogNewBox(msg.sender, trustedLockBox, boxSponsor);
        return trustedLockBox;
    }

    // Pass-Through Admin Controls

    function freezeBox(address _lockBox)
        onlyOwner
        onlyIfBox(_lockBox)
        returns (bool success)
    {
        LockBox trustedLockBox = LockBox(_lockBox);
        LogFreezeSwitchState(msg.sender, _lockBox, true);
        return(trustedLockBox.freeze(true));
    }

    function thawBox(address _lockBox)
        onlyOwner
        onlyIfBox(_lockBox)
        returns (bool success)
    {
        LockBox trustedLockBox = LockBox(_lockBox);
        LogFreezeSwitchState(msg.sender, _lockBox, false);
        return(trustedLockBox.freeze(false));
    }

    function changeBoxOwner(address _lockBox, address newOwner)
        public
        onlyOwner
        onlyIfBox(_lockBox)
        returns (bool success)
    {
        LockBox trustedLockBox = LockBox(_lockBox);
        LogChangeOwner(msg.sender, _lockBox, newOwner);
        return(trustedLockBox.changeOwner(newOwner));
    }
}