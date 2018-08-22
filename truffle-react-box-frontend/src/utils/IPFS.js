const IPFS = require('ipfs-mini');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

export const setJSON = (obj) => {
    return new Promise((resolve, reject) => {
        ipfs.addJSON(obj, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result);
            }
        });
    });
}

export const getJSON = (hash) => {
    return new Promise((resolve, reject) => {
        ipfs.catJSON(hash, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        });
    });
}
