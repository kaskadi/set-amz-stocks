module.exports.handler = async (event) => {
  const createBulkBody = require('./helpers/create-bulk-body.js')
  const setStocks = require('./helpers/set-stocks.js')
  return await setStocks(createBulkBody(event.responsePayload))
  .then(res => {
    console.log(JSON.stringify(res, null, 2))
    return res
  })
  .catch(err => {
    console.log(JSON.stringify(err, null, 2))
    return err
  })
}