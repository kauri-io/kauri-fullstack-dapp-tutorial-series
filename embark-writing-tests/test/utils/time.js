var getCurrentTime = async() => {
  var block = await web3.eth.getBlock("latest");
  return block.timestamp;
}

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

Object.assign(exports, {
  increaseTimeInSeconds,
  getCurrentTime
});
