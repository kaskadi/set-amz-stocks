module.exports.handler = async (event) => {
  const createBulkBody = require('./helpers/create-bulk-body.js')
  const setStocks = require('./helpers/set-es-stocks.js')
  console.log(JSON.stringify(event, null, 2))
  return await setStocks(createBulkBody(event.detail.responsePayload.stockData))
  .then(res => {
    console.log(JSON.stringify(res, null, 2))
    return res
  })
  .catch(err => {
    console.log(JSON.stringify(err, null, 2))
    return err
  })
}