import React, { Component } from "react";
import BountiesContract from "./contracts/Bounties.json";
import getWeb3 from "./utils/getWeb3";

import Button from 'react-bootstrap/lib/Button';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Panel from 'react-bootstrap/lib/Panel';

import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable';
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn';

import "./App.css";
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';

const etherscanBaseUrl = "https://rinkeby.etherscan.io"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      bountiesInstance: undefined,
      bountyAmount: undefined,
      bountyData: undefined,
      bountyDeadline: undefined,
      etherscanLink: "https://rinkeby.etherscan.io",
      bounties: [],
      account: null,
      web3: null
    }

    this.handleIssueBounty = this.handleIssueBounty.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = BountiesContract.networks[networkId];
      const instance = new web3.eth.Contract(
       BountiesContract.abi,
       deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ bountiesInstance: instance, web3: web3, account: accounts[0]})
      this.addEventListener(this)
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  addEventListener(component) {

    this.state.bountiesInstance.events.BountyIssued({fromBlock: 0, toBlock: 'latest'})
    .on('data', function(event){
      console.log(event); // same results as the optional callback above
      var newBountiesArray = component.state.bounties.slice()
      newBountiesArray.push(event.returnValues)
      component.setState({ bounties: newBountiesArray })
    })
    .on('error', console.error);
  }

  // Handle form data change

  handleChange(event)
  {
    switch(event.target.name) {
        case "bountyData":
            this.setState({"bountyData": event.target.value})
            break;
        case "bountyDeadline":
            this.setState({"bountyDeadline": event.target.value})
            break;
        case "bountyAmount":
            this.setState({"bountyAmount": event.target.value})
            break;
        default:
            break;
    }
  }

  async handleIssueBounty(event)
  {
    if (typeof this.state.bountiesInstance !== 'undefined') {
      event.preventDefault();
      //const ipfsHash = await setJSON({ bountyData: this.state.bountyData });
      let result = await this.state.bountiesInstance.methods.issueBounty(this.state.bountyData,this.state.bountyDeadline,{from: this.state.account, value: this.state.web3.utils.toWei(this.state.bountyAmount, 'ether')})
      this.setLastTransactionDetails(result)
    }
  }

  setLastTransactionDetails(result)
  {
    if(result.tx !== 'undefined')
    {
      this.setState({etherscanLink: etherscanBaseUrl+"/tx/"+result.tx})
    }
    else
    {
      this.setState({etherscanLink: etherscanBaseUrl})
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
      <Grid>
      <Row>
      <a href={this.state.etherscanLink} target="_blank" rel="noopener noreferrer">Last Transaction Details</a>
      </Row>
      <Row>
      <Panel>
      <Panel.Heading>Issue Bounty</Panel.Heading>
      <Form onSubmit={this.handleIssueBounty}>
          <FormGroup
            controlId="fromCreateBounty"
          >
            <FormControl
              componentClass="textarea"
              name="bountyData"
              value={this.state.bountyData}
              placeholder="Enter bounty details"
              onChange={this.handleChange}
            />
            <HelpBlock>Enter bounty data</HelpBlock><br/>

            <FormControl
              type="text"
              name="bountyDeadline"
              value={this.state.bountyDeadline}
              placeholder="Enter bounty deadline"
              onChange={this.handleChange}
            />
            <HelpBlock>Enter bounty deadline in seconds since epoch</HelpBlock><br/>

            <FormControl
              type="text"
              name="bountyAmount"
              value={this.state.bountyAmount}
              placeholder="Enter bounty amount"
              onChange={this.handleChange}
            />
            <HelpBlock>Enter bounty amount</HelpBlock><br/>
            <Button type="submit">Issue Bounty</Button>
          </FormGroup>
      </Form>
      </Panel>
      </Row>
      <Row>
      <Panel>
      <Panel.Heading>Issued Bounties</Panel.Heading>
      <BootstrapTable data={this.state.bounties} striped hover>
        <TableHeaderColumn isKey dataField='bounty_id'>ID</TableHeaderColumn>
        <TableHeaderColumn dataField='issuer'>Issuer</TableHeaderColumn>
        <TableHeaderColumn dataField='amount'>Amount</TableHeaderColumn>
        <TableHeaderColumn dataField='data'>Bounty Data</TableHeaderColumn>
      </BootstrapTable>
      </Panel>
      </Row>
      </Grid>


            </div>
    );
  }
}

export default App;
