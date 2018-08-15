const Bounties = artifacts.require("./Bounties.sol");
const getCurrentTime = require('./utils/time').getCurrentTime;
const increaseTimeInSeconds = require('./utils/time').increaseTimeInSeconds;
const assertRevert = require('./utils/assertRevert').assertRevert;
const dayInSeconds = 86400;

contract('Bounties', function(accounts) {

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

  it("Should not allow a user to issue a bounty without sending ETH", async () => {

    let bounties = await Bounties.new();
    assertRevert(bounties.issueBounty("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0]}), "Bounty issued without sending ETH");

  });

  it("Should not allow a user to issue a bounty when sending value of 0", async () => {

    let bounties = await Bounties.new();
    assertRevert(bounties.issueBounty("data",
                                getCurrentTime() + (dayInSeconds * 2),
                                {from: accounts[0], value: 0}), "Bounty issued when sending value of 0");

  });

  it("Should not allow a user to issue a bounty with a deadline in the past", async () => {

    let bounties = await Bounties.new();
    assertRevert(bounties.issueBounty("data",
                                getCurrentTime() - 1,
                                {from: accounts[0], value: 0}), "Bounty issued with deadline in the past");

  });

  it("Should not allow a user to issue a bounty with a deadline of now", async () => {

    let bounties = await Bounties.new();
    assertRevert(bounties.issueBounty("data",
                                getCurrentTime(),
                                {from: accounts[0], value: 0}), "Bounty issued with deadline of now");

  });

  it("Should allow a user to fulfil an existing bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    let tx = await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    assert.strictEqual(tx.receipt.logs.length, 1, "fulfillBounty() call did not log 1 event");
    assert.strictEqual(tx.logs.length, 1, "fulfillBounty() call did not log 1 event");
    const logBountyFulfilled = tx.logs[0];
    assert.strictEqual(logBountyFulfilled.event, "BountyFulfilled", "fulfillBounty() call did not log event BountyFulfilled");
    assert.strictEqual(logBountyFulfilled.args.bounty_id.toNumber(),0, "BountyFulfilled event logged did not have expected bounty_Id");
    assert.strictEqual(logBountyFulfilled.args.fulfiller, accounts[1], "BountyFulfilled event logged did not have expected fulfiller");
    assert.strictEqual(logBountyFulfilled.args.fulfillment_id.toNumber(),0, "BountyFulfilled event logged did not have expected fulfillment_id");

  });

  it("Should not allow a user to fulfil a non existent bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    assertRevert(bounties.fulfillBounty(1,"data",{from: accounts[1]}), "Fulfillment accepted with invalid bounty_id");

  });

  it("Should not allow an issuer to fulfil an existing bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    assertRevert(bounties.fulfillBounty(0,"data",{from: accounts[0]}), "Fulfillment accepted from issuer");

  });

  it("Should not allow a user to fulfil an existing bounty where the deadline has passed", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});
    await increaseTimeInSeconds((dayInSeconds * 2)+1)

    assertRevert(bounties.fulfillBounty(0,"data",{from: accounts[1]}), "Fulfillment accepted when deadline has passed");

  });

  it("Should allow the issuer to accept an existing fulfillment", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    let tx = await bounties.acceptFulfillment(0,0,{from: accounts[0]})

    assert.strictEqual(tx.receipt.logs.length, 1, "acceptFulfillment() call did not log 1 event");
    assert.strictEqual(tx.logs.length, 1, "acceptFulfillment() call did not log 1 event");
    const logFulfillmentAccepted = tx.logs[0];
    assert.strictEqual(logFulfillmentAccepted.event, "FulfillmentAccepted", "acceptFulfillment() call did not log event FulfillmentAccepted");
    assert.strictEqual(logFulfillmentAccepted.args.bounty_id.toNumber(),0, "FulfillmentAccepted event logged did not have expected bounty_Id");
    assert.strictEqual(logFulfillmentAccepted.args.issuer, accounts[0], "FulfillmentAccepted event logged did not have expected issuer");
    assert.strictEqual(logFulfillmentAccepted.args.fulfiller, accounts[1], "FulfillmentAccepted event logged did not have expected fulfiller");
    assert.strictEqual(logFulfillmentAccepted.args.fulfillment_id.toNumber(),0, "FulfillmentAccepted event logged did not have expected fulfillment_id");
    assert.strictEqual(logFulfillmentAccepted.args.amount.toNumber(),500000000000000000, "FulfillmentAccepted event logged did not have expected amount");


  });

  it("Should not allow issuer to accept a non existent fulfillment", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    assertRevert(bounties.acceptFulfillment(0,1,{from: accounts[0]}), "Fulfillment accepted with invalid fufillment_id");

  });

  it("Should not allow a user who is not the issuer to accept an existing fulfillment", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    assertRevert(bounties.acceptFulfillment(0,0,{from: accounts[1]}),"Fulfillment accepted by user other than issuer")

  });

  it("Should not allow a user to fulfill an ACCEPTED bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    await bounties.acceptFulfillment(0,0,{from: accounts[0]})

    assertRevert(bounties.fulfillBounty(0,"data",{from: accounts[1]}), "Fulfillment accepted for bounty already accepted");

  });

  it("Should allow the issuer to cancel an existing bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    let tx = await bounties.cancelBounty(0,{from: accounts[0]})

    assert.strictEqual(tx.receipt.logs.length, 1, "cancelBounty() call did not log 1 event");
    assert.strictEqual(tx.logs.length, 1, "cancelBounty() call did not log 1 event");
    const logBountyCancelled = tx.logs[0];
    assert.strictEqual(logBountyCancelled.event, "BountyCancelled", "cancelBounty() call did not log event FulfillmentAccepted");
    assert.strictEqual(logBountyCancelled.args.bounty_id.toNumber(),0, "BountyCancelled event logged did not have expected bounty_Id");
    assert.strictEqual(logBountyCancelled.args.issuer, accounts[0], "FulfillmentAccepted event logged did not have expected issuer");
    assert.strictEqual(logBountyCancelled.args.amount.toNumber(),500000000000000000, "FulfillmentAccepted event logged did not have expected amount");

  });

  it("Should not allow the issuer to cancel a non existent bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    assertRevert(bounties.cancelBounty(1,{from: accounts[0]}), "Cancelled non existent bounty")


  });

  it("Should not allow the issuer to cancel an existing bounty which has already been accepted", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    await bounties.fulfillBounty(0,"data",{from: accounts[1]});

    await bounties.acceptFulfillment(0,0,{from: accounts[0]})

    assertRevert(bounties.cancelBounty(0,{from: accounts[0]}), "Cancelled bounty which had already been accepted")

  });

  it("Should not allow a user which is not the issuer to cancel an existing bounty", async () => {

    let bounties = await Bounties.new();
    await bounties.issueBounty("data",
                          getCurrentTime() + (dayInSeconds * 2),
                          {from: accounts[0], value: 500000000000000000});

    assertRevert(bounties.cancelBounty(0,{from: accounts[1]}), "Cancelled by an address which is not the issuer")

  });


});
