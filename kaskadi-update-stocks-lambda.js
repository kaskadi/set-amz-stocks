const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  console.log('Function called', event)
  const { stockData, warehouse } = event
  const body = createBulkBody(stockData, warehouse)
  console.log('Calling bulk update on ES', body)
  await es.bulk({
    refresh: true,
    body
  })
}

function createBulkBody(stockData, warehouse) {
  const bulkBody = stockData.flatMap(data => {
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
  return bulkBody.concat([
    {
      update: {
        _id: warehouse,
        _index: "warehouses"
      }
    },
    {
      doc: {
        stockLastUpdated: Date.now()
      }
    }
  ])
}
