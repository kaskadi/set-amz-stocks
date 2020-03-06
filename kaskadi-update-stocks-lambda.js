const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  const { stockData, warehouse } = JSON.parse(event)
  const body = getBulkBody(stockData, warehouse)
  await es.bulk({
    refresh: true,
    body
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

// force
