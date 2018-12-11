function increaseTimeInSeconds(increaseInSeconds) {
	return new Promise(function(resolve) {
		web3.currentProvider.send({
			jsonrpc: "2.0",
			method: "evm_increaseTime",
			params: [increaseInSeconds],
			id: new Date().getTime()
		}, resolve);
	});
};

function getCurrentTime() {
	return new Promise(function(resolve) {
  	web3.eth.getBlock("latest").then(function(block) {
			resolve(block.timestamp)
		});
	})
}

Object.assign(exports, {
  increaseTimeInSeconds,
  getCurrentTime
});
