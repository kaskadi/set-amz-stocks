module.exports.handler = async (event) => {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  const { stockData, warehouse, provider } = event
  const body = createBulkBody(stockData, warehouse, provider)
  await es.bulk({
    refresh: true,
    body
  })
}

function createBulkBody(stockData, warehouse, provider) {
  return stockData.flatMap(processStockData(warehouse, provider)).concat([
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

function processStockData(warehouse, provider) {
  return data => [getOp(data, provider), getBody(data, warehouse, provider)]
}

function getOp(data, provider) {
  let op = { update: { _id: data.id, _index: 'products' } }
  if (provider === 'amz') {
    op = { updateByQuery: { _index: 'products', _refresh: true } }
  }
  return op
}

function getBody(data, warehouse, provider) {
  let body = { doc: { stocks: {} } }
  let stock = { idType: 'EAN', stockMap: {} }
  stock.stockMap[data.id] = {
    amount: data.quantity,
    condition: data.condition || ''
  }
  if (provider === 'amz') {
    stock.idType = 'ASIN'
    body = {
      script: {
        lang: 'painless',
        source: `ctx._source['stocks'][${warehouse}] = ${JSON.stringify(stock)}`
      },
      query: { match: {} }
    }
    body.query.match[`asin.${warehouse.split('_')[1].toUpperCase()}`] = data.id
  } else {
    body.doc.stocks[warehouse] = stock
  }
  return body
}