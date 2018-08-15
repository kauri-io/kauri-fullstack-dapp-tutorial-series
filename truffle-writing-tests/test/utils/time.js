function increaseTimeInSeconds(increaseInSeconds) {
	return new Promise(function(resolve) {
		web3.currentProvider.sendAsync({
			jsonrpc: "2.0",
			method: "evm_increaseTime",
			params: [increaseInSeconds],
			id: new Date().getTime()
		}, resolve);
	});
};

function getCurrentTime() {
  var block = web3.eth.getBlock("latest");
  return block.timestamp;
}

Object.assign(exports, {
  increaseTimeInSeconds,
  getCurrentTime
});
