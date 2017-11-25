const Remittance = artifacts.require("./Remittance.sol");
const expectedExceptionPromise = require("../expected_exception_testRPC_and_geth.js");
const abi = require('ethereumjs-abi');

const Promise = require("bluebird")

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Remittance', accounts => {
    let instance;
    let owner = accounts[0] ;
    let Carol = accounts[2];
    let password = "password-Bobs-Part" + "password-Carols-Part";
    let hash;

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

    it("should allow the owner to send a remittance for Carol", () => {
        let remittanceAmount = 60000;
        let event = "LogRemittance";
        let _event;
        let loggedAmount;
        let depositor;
        return instance.hashHelper.call(password, Carol, {from: owner})
            .then(_hash => {
                hash = _hash;
                return instance.sendRemittance(password, Carol, {from: owner, value: remittanceAmount})
            })
            .then(txObj => {
                _event = txObj.logs[0].event.toString(10);
                depositor = txObj.logs[0].args.depositor;
                loggedAmount = txObj.logs[0].args.amount.toString(10);
                return instance.LockBoxCluster.call(hash, {from: owner})
            })
            .then(_lockBox => {
                let fundsWaiting = _lockBox[0].toString(10);
                let invalidKey = _lockBox[1];
                (10);
                assert.strictEqual(_event, event, "the LogRemittance event did not occur");
                assert.strictEqual(loggedAmount, remittanceAmount.toString(10), "the LogRemittance event did not occur");
                assert.strictEqual(depositor, owner, "the correct sender was not logged.");
                assert.strictEqual(fundsWaiting, remittanceAmount.toString(10), "Carol's LockBox.fundsWaiting state was not set correctly");
                assert.strictEqual(invalidKey, false, "Carol's LockBox.usedKey state was not set correctly");
            })
    })

    it("should allow Carol to claim her funds", () => {
        let remittanceAmount = 60000;
        let event = "LogClaim";
        let _event;
        let loggedAmount;
        let depositor;
        return instance.hashHelper.call(password, Carol, {from: owner})
            .then(_hash => {
                hash = _hash;
                return instance.sendRemittance(password, Carol, {from: owner, value: remittanceAmount})
            })
            .then(() => {
                return instance.claimRemittance(password, {from: Carol}) 
            })
            .then(txObj => {
                _event = txObj.logs[0].event;
                claimant = txObj.logs[0].args.claimant;
                loggedAmount = txObj.logs[0].args.funds.toString(10);
                invalidKey = txObj.logs[0].args._invalidKey;
                return instance.LockBoxCluster(hash, {from: Carol})
            })
            .then(_lockBox => {
                let fundsWaiting = _lockBox[0].toString(10);
                let invalidKey = _lockBox[1];
                assert.strictEqual(_event, event, "the LogRemittance event did not occur");
                assert.strictEqual(claimant, Carol, "the correct sender was not logged.");
                assert.strictEqual(fundsWaiting, "0", "Carol's LockBox.fundsWaiting  was not reset to 0");
                assert.strictEqual(invalidKey, true, "Carol's LockBox Key  was not invalidated");
                
            })
    })

    it("should confirm that carol receives her claimed funds", async() => {
        let remittanceAmount = 60000;
        let startBalance;
        let gasPrice;
        let gasUsed;
        let txFee;
        let endBalance;
        startBalance = await web3.eth.getBalancePromise(Carol);
        await instance.sendRemittance(password, Carol, {from: owner, value: remittanceAmount});
        txObj = await instance.claimRemittance(password, {from: Carol});
        gasUsed = txObj.receipt.gasUsed;
        tx = await web3.eth.getTransactionPromise(txObj.tx);
        gasPrice = tx.gasPrice;
        txFee = gasPrice.times(gasUsed);
        endBalance = await web3.eth.getBalancePromise(Carol)
        assert.strictEqual(startBalance.plus(remittanceAmount).minus(txFee).toString(10), endBalance.toString(10), "Carol didn't get her ether")  
    })

    it("should not allow a key to be used more than once", () => {
        let remittanceAmount = 60000;
        return instance.sendRemittance(password, Carol, {from: owner, value: remittanceAmount})
            .then(() => {
                return instance.claimRemittance(password, {from: Carol}) 
            })
            .then(() => {
                expectedExceptionPromise(() => {
                    return instance.sendRemittance(password, Carol, {from: owner, value: remittanceAmount})
                })
                
            })   
    })
})
