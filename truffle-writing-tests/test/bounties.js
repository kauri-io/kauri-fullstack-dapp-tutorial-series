const Bounties = artifacts.require("./Bounties.sol");
const getCurrentTime = require('./utils/time').getCurrentTime;
const increaseTimeInSeconds = require('./utils/time').increaseTimeInSeconds;
const assertRevert = require('./utils/assertRevert').assertRevert;
const dayInSeconds = 86400;


contract('Bounties', function(accounts) {

  let bountiesInstance;

  beforeEach(async () => {
      bountiesInstance = await Bounties.new()
  })

  it("Should allow a user to issue a new bounty", async () => {

    let bounties = await Bounties.new();
    let tx = await bounties.issueBounty("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0], value: 500000000000000000});

    assert.strictEqual(tx.receipt.logs.length, 1, "issueBounty() call did not log 1 event");
    assert.strictEqual(tx.logs.length, 1, "issueBounty() call did not log 1 event");
    const logBountyIssued = tx.logs[0];
    assert.strictEqual(logBountyIssued.event, "BountyIssued", "issueBounty() call did not log event BountyIssued");
    assert.strictEqual(logBountyIssued.args.bounty_id.toNumber(),0, "BountyIssued event logged did not have expected bounty_Id");
    assert.strictEqual(logBountyIssued.args.issuer, accounts[0], "BountyIssued event logged did not have expected issuer");
    assert.strictEqual(logBountyIssued.args.amount.toNumber(),500000000000000000, "BountyIssued event logged did not have expected amount");

  });

  it("Should return an integer when calling issueBounty", async () => {

    let result = await bountiesInstance.issueBounty.call("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0], value: 500000000000000000});

    assert.strictEqual(result.toNumber(), 0, "issueBounty() call did not return correct id");
  });

  it("Should not allow a user to issue a bounty without sending ETH", async () => {

    assertRevert(bountiesInstance.issueBounty("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0]}), "Bounty issued without sending ETH");

  });

  it("Should not allow a user to issue a bounty when sending value of 0", async () => {

    assertRevert(bountiesInstance.issueBounty("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0], value: 0}), "Bounty issued when sending value of 0");

  });

  it("Should not allow a user to issue a bounty with a deadline in the past", async () => {

    assertRevert(bountiesInstance.issueBounty("data",
                                getCurrentTime() - 1,
                                {from: accounts[0], value: 0}), "Bounty issued with deadline in the past");

  });

  it("Should not allow a user to issue a bounty with a deadline of now", async () => {

    assertRevert(bountiesInstance.issueBounty("data",
                                getCurrentTime(),
                                {from: accounts[0], value: 0}), "Bounty issued with deadline of now");

  });

  it("Should not allow a user to fulfil an existing bounty where the deadline has passed", async () => {

    await bountiesInstance.issueBounty("data",
                      getCurrentTime() + (dayInSeconds * 2),
                      {from: accounts[0], value: 500000000000000000});

    await increaseTimeInSeconds((dayInSeconds * 2)+1)

    assertRevert(bountiesInstance.fulfillBounty(0,"data",{from: accounts[1]}), "Fulfillment accepted when deadline has passed");

  });

});
