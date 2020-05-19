module.exports.handler = async (event) => {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  const { stockData, warehouse } = event
  const body = createBulkBody(stockData, warehouse)
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
      amount: data.quantity,
      condition: data.condition || ''
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
