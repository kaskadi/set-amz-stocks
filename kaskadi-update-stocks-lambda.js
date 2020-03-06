const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  console.log('Function called', event)
  const { stockData, warehouse } = event
  const body = getBulkBody(stockData, warehouse)
  console.log('Calling bulk update on ES', body)
  await es.bulk({
    refresh: true,
    body
  })
  await es.update({
    id: warehouse,
    index: 'warehouses',
    body: {
      doc: {
        stock_last_updated: Date.now()
      }
    }
  })
}

function getBulkBody(stockData, warehouse) {
  return stockData.flatMap(data => {
    const op = {
      update: {
        _id: data.id,
        _index: "products"
      }
    }
    let doc = {
      doc: {
        stocks: {}
      }
    }
    doc.doc.stocks[warehouse] = {
      amount: data.quantity
    }
    return [op, doc]
  })
}
