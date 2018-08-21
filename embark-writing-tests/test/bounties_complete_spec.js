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
  let currentTime;

  beforeEach(async () => {
      bountiesInstance = await Bounties.deploy().send();
      currentTime = await getCurrentTime();
  })

  it("Should allow a user to issue a new bounty", async () => {

    let tx = await bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2)).send({from: accounts[0], value: 500000000000000000});

    assert.strictEqual(Object.keys(tx.events).length, 1, "issueBounty() call did not log 1 event");
    const logBountyIssued = tx.events.BountyIssued;
    assert.equal(logBountyIssued.returnValues.bounty_id,0, "BountyIssued event logged did not have expected bounty_Id");
    assert.equal(logBountyIssued.returnValues.issuer, accounts[0], "BountyIssued event logged did not have expected issuer");
    assert.equal(logBountyIssued.returnValues.amount,500000000000000000, "BountyIssued event logged did not have expected amount");

  });

  it("Should return an integer when calling issueBounty", async () => {

     let result = await bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2))
                              .call({from: accounts[0], value: 500000000000000000});

     assert.equal(result, 0, "issueBounty() call did not return correct id");
  });

  it("Should not allow a user to issue a bounty without sending ETH", async () => {

      assertRevert(bountiesInstance.methods.issueBounty("data",
                              currentTime + (dayInSeconds * 2))
                              .send({from: accounts[0]}), "Bounty issued without sending ETH");

  });

  it("Should not allow a user to issue a bounty when sending value of 0", async () => {

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime + (dayInSeconds * 2))
                            .send({from: accounts[0], value: 0}), "Bounty issued when sending value of 0");

  });

  it("Should not allow a user to issue a bounty with a deadline in the past", async () => {

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime - 1).send({from: accounts[0], value: 0}), "Bounty issued with deadline in the past");

  });

  it("Should not allow a user to issue a bounty with a deadline of now", async () => {

    assertRevert(bountiesInstance.methods.issueBounty("data",
                            currentTime)
                            .send({from: accounts[0], value: 0}), "Bounty issued with deadline of now");

  });

  it("Should allow a user to fulfil an existing bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    let tx = await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    assert.strictEqual(Object.keys(tx.events).length, 1, "fulfillBounty() call did not log 1 event");
    const logBountyFulfilled = tx.events.BountyFulfilled;
    assert.equal(logBountyFulfilled.returnValues.bounty_id,0, "BountyFulfilled event logged did not have expected bounty_Id");
    assert.equal(logBountyFulfilled.returnValues.fulfiller, accounts[1], "BountyFulfilled event logged did not have expected fulfiller");
    assert.equal(logBountyFulfilled.returnValues.fulfillment_id,0, "BountyFulfilled event logged did not have expected fulfillment_id");

  });

  it("Should not allow a user to fulfil a non existent bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    assertRevert(bountiesInstance.methods.fulfillBounty(1,"data").send({from: accounts[1]}), "Fulfillment accepted with invalid bounty_id");

  });

  it("Should not allow an issuer to fulfil an existing bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    assertRevert(bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[0]}), "Fulfillment accepted from issuer");

  });


  it("Should not allow a user to fulfil an existing bounty where the deadline has passed", async () => {

    await bountiesInstance.methods.issueBounty("data",
                      currentTime + (dayInSeconds * 2))
                      .send({from: accounts[0], value: 500000000000000000});

    await increaseTimeInSeconds((dayInSeconds * 2)+1);

    assertRevert(bountiesInstance.methods.fulfillBounty(0,"data").call({from: accounts[1]}), "Fulfillment accepted when deadline has passed");

  });

  it("Should allow the issuer to accept an existing fulfillment", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    let tx = await bountiesInstance.methods.acceptFulfillment(0,0).send({from: accounts[0]})

    assert.strictEqual(Object.keys(tx.events).length, 1, "acceptFulfillment() call did not log 1 event");
    const logFulfillmentAccepted = tx.events.FulfillmentAccepted;
    assert.equal(logFulfillmentAccepted.returnValues.bounty_id,0, "FulfillmentAccepted event logged did not have expected bounty_Id");
    assert.equal(logFulfillmentAccepted.returnValues.issuer, accounts[0], "FulfillmentAccepted event logged did not have expected issuer");
    assert.equal(logFulfillmentAccepted.returnValues.fulfiller, accounts[1], "FulfillmentAccepted event logged did not have expected fulfiller");
    assert.equal(logFulfillmentAccepted.returnValues.fulfillment_id,0, "FulfillmentAccepted event logged did not have expected fulfillment_id");
    assert.equal(logFulfillmentAccepted.returnValues.amount,500000000000000000, "FulfillmentAccepted event logged did not have expected amount");


  });

  it("Should not allow issuer to accept a non existent fulfillment", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    assertRevert(bountiesInstance.methods.acceptFulfillment(0,1).send({from: accounts[0]}), "Fulfillment accepted with invalid fufillment_id");

  });

  it("Should not allow a user who is not the issuer to accept an existing fulfillment", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    assertRevert(bountiesInstance.methods.acceptFulfillment(0,0).send({from: accounts[1]}),"Fulfillment accepted by user other than issuer")

  });

  it("Should not allow a user to fulfill an ACCEPTED bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime+ (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    await bountiesInstance.methods.acceptFulfillment(0,0).send({from: accounts[0]})

    assertRevert(bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]}), "Fulfillment accepted for bounty already accepted");

  });

  it("Should allow the issuer to cancel an existing bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime+ (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    let tx = await bountiesInstance.methods.cancelBounty(0).send({from: accounts[0]})

    assert.strictEqual(Object.keys(tx.events).length, 1, "cancelBounty() call did not log 1 event");
    const logBountyCancelled = tx.events.BountyCancelled;
    assert.equal(logBountyCancelled.returnValues.bounty_id,0, "BountyCancelled event logged did not have expected bounty_Id");
    assert.equal(logBountyCancelled.returnValues.issuer, accounts[0], "FulfillmentAccepted event logged did not have expected issuer");
    assert.equal(logBountyCancelled.returnValues.amount,500000000000000000, "FulfillmentAccepted event logged did not have expected amount");

  });

  it("Should not allow the issuer to cancel a non existent bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    assertRevert(bountiesInstance.methods.cancelBounty(1).send({from: accounts[0]}), "Cancelled non existent bounty")


  });

  it("Should not allow the issuer to cancel an existing bounty which has already been accepted", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime + (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    await bountiesInstance.methods.fulfillBounty(0,"data").send({from: accounts[1]});

    await bountiesInstance.methods.acceptFulfillment(0,0).send({from: accounts[0]})

    assertRevert(bountiesInstance.methods.cancelBounty(0).send({from: accounts[0]}), "Cancelled bounty which had already been accepted")

  });

  it("Should not allow a user which is not the issuer to cancel an existing bounty", async () => {

    await bountiesInstance.methods.issueBounty("data",
                          currentTime+ (dayInSeconds * 2))
                          .send({from: accounts[0], value: 500000000000000000});

    assertRevert(bountiesInstance.methods.cancelBounty(0).send({from: accounts[1]}), "Cancelled by an address which is not the issuer")

  });


});
