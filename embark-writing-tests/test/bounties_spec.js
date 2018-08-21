const Bounties = embark.require('Embark/contracts/Bounties');
const getCurrentTime = require('./utils/time').getCurrentTime;
const increaseTimeInSeconds = require('./utils/time').increaseTimeInSeconds;
const assertRevert = require('./utils/assertRevert').assertRevert;
const dayInSeconds = 86400;

let accounts;

config({

}, (err, theAccounts) => {
  accounts = theAccounts;
});

contract("Bounties", function () {

  let bountiesInstance;

  beforeEach(async () => {
      bountiesInstance = await Bounties.deploy().send()
  })

  it("Should allow a user to issue a new bounty", async () => {

    let currentTime = await getCurrentTime();
    let tx = await bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2)).send({from: accounts[0], value: 500000000000000000});

    assert.strictEqual(Object.keys(tx.events).length, 1, "issueBounty() call did not log 1 event");
    const logBountyIssued = tx.events.BountyIssued;
    assert.equal(logBountyIssued.returnValues.bounty_id,0, "BountyIssued event logged did not have expected bounty_Id");
    assert.equal(logBountyIssued.returnValues.issuer, accounts[0], "BountyIssued event logged did not have expected issuer");
    assert.equal(logBountyIssued.returnValues.amount,500000000000000000, "BountyIssued event logged did not have expected amount");

  });

  it("Should return an integer when calling issueBounty", async () => {

     let currentTime = await getCurrentTime();
     let result = await bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2))
                              .call({from: accounts[0], value: 500000000000000000});

     assert.equal(result, 0, "issueBounty() call did not return correct id");
  });

  it("Should not allow a user to issue a bounty without sending ETH", async () => {

      let currentTime = await getCurrentTime();

      assertRevert(bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2))
                              .send({from: accounts[0]}), "Bounty issued without sending ETH");

  });

  it("Should not allow a user to issue a bounty when sending value of 0", async () => {

    let currentTime = await getCurrentTime();

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime + (dayInSeconds * 2))
                            .send({from: accounts[0], value: 0}), "Bounty issued when sending value of 0");

  });

  it("Should not allow a user to issue a bounty with a deadline in the past", async () => {

    let currentTime = await getCurrentTime();

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime - 1).send({from: accounts[0], value: 0}), "Bounty issued with deadline in the past");

  });

  it("Should not allow a user to issue a bounty with a deadline of now", async () => {

    let currentTime = await getCurrentTime();

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime)
                            .send({from: accounts[0], value: 0}), "Bounty issued with deadline of now");

  });

  it("Should not allow a user to fulfil an existing bounty where the deadline has passed", async () => {

    let currentTime = await getCurrentTime();

    await bountiesInstance.methods.issueBounty("data",
                      currentTime + (dayInSeconds * 2))
                      .send({from: accounts[0], value: 500000000000000000});

    await increaseTimeInSeconds((dayInSeconds * 2)+1);

    assertRevert(bountiesInstance.methods.fulfillBounty(0,"data").call({from: accounts[1]}), "Fulfillment accepted when deadline has passed");

  });

});
