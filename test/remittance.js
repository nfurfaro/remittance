const Remittance = artifacts.require("./Remittance.sol");
const expectedExceptionPromise = require("../expected_exception_testRPC_and_geth.js");
const Promise = require("bluebird")

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Remittance', accounts => {
    let instance;
    let owner = accounts[0] ;
    let Carol = accounts[2];

    beforeEach(() => {
        return Remittance.new(Carol,{ from: owner }
        ).then(_instance => {
            instance = _instance;
        })
    });

    it("should be owned by owner", async() => {
        _owner = await instance.owner(
        );
        assert.strictEqual(_owner, owner, "Contract is not owned by owner");
    });

    it("should return a correctly-hashed password", () => {
        let password = "peanut-butter-sandwich";
        return instance.passwordHasher(password, {from: owner})
            .then(_hash => {
                assert.strictEqual(_hash, "0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36", "password wasn't hashed or returned correctly");
            })
    });

    it("should allow the owner to set the passwords", () => {
        let hashed1 = 0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36
        let hashed2 = 0x754b1823247e990c20230ca0d8806c29508cc9244c059c09a1869b56ab64dacd
        return instance.setPasswords(hashed1, hashed2, {from:owner})
            .then(() => {
                return instance.hashedPasswords()
            })
            .then(_hash => {
                assert.strictEqual(_hash.toString(10), "0x88dc9fe9b1acbfe7d31ded4b484a30e4233e51b3228d9eb9e3bbb801a5b8a482", " the passwords were not set correctly")
            })
    })

    it("should not allow anyone but the owner to set the passwords", () => {
        let unauthorizedPerson = accounts[1];
        let hashed1 = 0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36
        let hashed2 = 0x754b1823247e990c20230ca0d8806c29508cc9244c059c09a1869b56ab64dacd
        expectedExceptionPromise(() => {
            return instance.setPasswords(hashed1, hashed2, {from:unauthorizedPerson});
        })
    })

    it("should add a new deposit to the contract balance", () => {
        let hashed1 = 0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36
        let hashed2 = 0x754b1823247e990c20230ca0d8806c29508cc9244c059c09a1869b56ab64dacd
        let deposit= 1000;
        let expected = "1000";
        let event = "LogDeposit";
        let contractBalanceBefore;
        let contractBalanceAfter;
        return web3.eth.getBalancePromise(instance.address)
            .then(_balance  => {
                contractBalanceBefore = _balance;
                return instance.setPasswords(hashed1, hashed2, {from:owner})
            })
            .then(() => {
                return instance.deposit({from: owner, value: deposit})  
            }).then(txObj => {
                assert.strictEqual(txObj.logs[0].event, event, "a deposit was not logged");
                return web3.eth.getBalancePromise(instance.address)
            }).then(_balance  => {
                contractBalanceAfter = _balance;
                assert.strictEqual(_balance.toString(10), expected, "Splitter balance was not increased by 10 wei");
            })
    });

    it("should allow Carol to unlock the funds by validating her passwords", async() => {
        let hashed1 = 0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36;
        let hashed2 = 0x754b1823247e990c20230ca0d8806c29508cc9244c059c09a1869b56ab64dacd;
        let result;
        let deposit = 1000;
        await instance.setPasswords(hashed1, hashed2, {from:owner});
        await instance.deposit({from: owner, value: deposit});
        await instance.validatePasswords(hashed1, hashed2, {from: Carol});
        result = await instance.fundsUnlocked();    
        assert.strictEqual(result, true, "Carol was not able to validate her passwords");
    })

    it("should confirm that carol can withdraw her funds", async() => {
        let startBalance;
        let payout;
        let gasPrice;
        let gasUsed;
        let txFee;
        let endBalance;
        let hashed1 = 0xbf99d12625bf06ca9eb22dcd41ab8f3e00814126e293aed5c6365f5752512d36;
        let hashed2 = 0x754b1823247e990c20230ca0d8806c29508cc9244c059c09a1869b56ab64dacd;
        let deposit = 1000;
        startBalance = await web3.eth.getBalancePromise(Carol);
        await instance.setPasswords(hashed1, hashed2, {from:owner});
        await instance.deposit({from: owner, value: deposit});
        await instance.validatePasswords(hashed1, hashed2, {from: Carol}); 
        txObj = await instance.withdrawFunds({from: Carol});
        gasUsed = txObj.receipt.gasUsed;
        tx = await web3.eth.getTransactionPromise(txObj.tx);
        gasPrice = tx.gasPrice;
        txFee = gasPrice.times(gasUsed);
        endBalance = await web3.eth.getBalancePromise(Carol)
        assert.strictEqual(startBalance.plus(deposit).minus(txFee).toString(10), endBalance.toString(10), "Carol didn't get her ether")  
    })
})
