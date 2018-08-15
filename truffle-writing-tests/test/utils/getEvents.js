var getEvents = (filter) => {
  return new Promise((resolve, reject) => {
    filter.get(function(err, logs) {
      try {
        if (err) {
          reject(err);
        }
        resolve(logs);
      } catch (err) {
        reject(err);
      }
    });
  })
}

Object.assign(exports, {
  getEvents
});


