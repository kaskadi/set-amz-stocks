module.exports.handler = async (event) => {
  const getUpdateData = require('./helpers/get-update-data.js')
  const processUpdateData = require('./helpers/process-update-data.js')
  const createBulkBody = require('./helpers/create-bulk-body.js')
  const setStocks = require('./helpers/set-stocks.js')
  objLogger(event)
  await getUpdateData(event)
  .then(updateData => createBulkBody(updateData, processUpdateData, event))
  .then(setStocks)
  .then(objLogger)
  .catch(objLogger)
}

function objLogger(obj) {
  console.log(JSON.stringify(obj, null, 2))
}