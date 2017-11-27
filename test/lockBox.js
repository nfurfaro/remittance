const Hub = artifacts.require("./Hub.sol");
const LockBox = artifacts.require("./LockBox.sol");
const expectedExceptionPromise = require("../expected_exception_testRPC_and_geth.js");
const abi = require('ethereumjs-abi');

const Promise = require("bluebird")

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('LockBox', accounts => {

    let myHub;
    let lockBoxContract;
    let instance;
    let owner = accounts[0];
    let Alice = accounts[1];
    let Carol = accounts[2];
    let remittanceAmount = 60000;
    let password = "ThisIsNotaStrongPassword";
    let pin = 4321;
    let hash;
    let _event;
    let loggedAmount;
    let depositor;

    beforeEach(() => {
        return Hub.new({from: owner})
            .then(_instance => {
                myHub = _instance;
                return myHub.newLockBox(Alice)
            })
            .then(txObj => {
                lockBoxInstance = LockBox.at(txObj.logs[0].args.lockBox)
            })
    });

    it("should be sponsored by Alice", async() => {
        sponsor = await lockBoxInstance.sponsor.call({from: owner}
        );
        assert.equal(sponsor, Alice, "Contract is not sponsored by Alice");
    })

    it("should allow Alice to send a remittance for Carol", () => {

        let event = "LogBoxCreated";

        return lockBoxInstance.hashHelper.call(Carol, password, pin, {from: owner})
            .then(_hash => {
                hash = _hash;
                return lockBoxInstance.sendToBox(hash, {from: Alice, value: remittanceAmount})
            })
            .then(txObj => {
                _event = txObj.logs[0].event.toString(10);
                depositor = txObj.logs[0].args.depositor;
                loggedAmount = txObj.logs[0].args.amount.toString(10);
                return lockBoxInstance.LockBoxCluster.call(hash, {from: owner})
            })
            .then(_lockBox => {
                let fundsWaiting = _lockBox[0].toString(10);
                let invalidKey = _lockBox[1];
                (10);
                assert.strictEqual(_event, event, "the LogRemittance event did not occur");
                assert.strictEqual(loggedAmount, remittanceAmount.toString(10), "the LogRemittance event did not occur");
                assert.strictEqual(depositor, Alice, "the correct sender was not logged.");
                assert.strictEqual(fundsWaiting, remittanceAmount.toString(10), "Carol's LockBox.fundsWaiting state was not set correctly");
                assert.strictEqual(invalidKey, false, "Carol's LockBox.usedKey state was not set correctly");
            })
    })

    it("should allow Carol to claim her funds", () => {

        let event = "LogBoxOpened";

        return lockBoxInstance.hashHelper.call(Carol, password, pin, {from: owner})
            .then(_hash => {
                hash = _hash;
                return lockBoxInstance.sendToBox(hash, {from: Alice, value: remittanceAmount})
            })
            .then(() => {
                return lockBoxInstance.openBox(password, pin, {from: Carol}) 
            })
            .then(txObj => {
                _event = txObj.logs[0].event;
                claimant = txObj.logs[0].args.claimant;
                loggedAmount = txObj.logs[0].args.funds.toString(10);
                invalidKey = txObj.logs[0].args._invalidKey;
                return lockBoxInstance.LockBoxCluster(hash, {from: Carol})
            })
            .then(_lockBox => {
                let fundsWaiting = _lockBox[0].toString(10);
                let invalidKey = _lockBox[1];
                assert.strictEqual(_event, event, "the LogBoxOpened event did not occur");
                assert.strictEqual(claimant, Carol, "the correct sender was not logged.");
                assert.strictEqual(fundsWaiting, "0", "Carol's LockBox.fundsWaiting  was not reset to 0");
                assert.strictEqual(invalidKey, true, "Carol's LockBox Key  was not invalidated");
                
            })
    })

    it("should confirm that carol receives her claimed funds", async() => {
        let startBalance;
        let gasPrice;
        let gasUsed;
        let txFee;
        let endBalance;
        hash = await lockBoxInstance.hashHelper.call(Carol, password, pin, {from: owner});
        startBalance = await web3.eth.getBalancePromise(Carol);

        await lockBoxInstance.sendToBox(hash, {from: Alice, value: remittanceAmount});
        txObj = await lockBoxInstance.openBox(password, pin, {from: Carol});
        gasUsed = txObj.receipt.gasUsed;
        tx = await web3.eth.getTransactionPromise(txObj.tx);
        gasPrice = tx.gasPrice;
        txFee = gasPrice.times(gasUsed);
        endBalance = await web3.eth.getBalancePromise(Carol)
        assert.strictEqual(startBalance.plus(remittanceAmount).minus(txFee).toString(10), endBalance.toString(10), "Carol didn't get her ether")  
    })
})
