module.exports.handler = async (event) => {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  const { stockData, warehouse, provider } = event
  const body = createBulkBody(stockData, warehouse, provider)
  // await es.bulk({
  //   refresh: true,
  //   body
  // })
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
  return provider === 'amz' ?
  { updateByQuery: { _index: 'products', _refresh: true } }
  :
  { update: { _id: data.id, _index: 'products' } }
}

function getBody(data, warehouse, provider) {
  let body = { doc: { stocks: {} } }
  if (provider === 'amz') {
    body = {
      script: {
        lang: 'painless',
        source: `ctx._source.stocks.${warehouse} = [ 'idType': 'ASIN', 'stockMap': [ 'quantity': ${data.quantity}, 'condition': ${data.condition || ''} ] ]`
      },
      query: { match: {} }
    }
    body.query.match[`asin.${warehouse.split('_')[1].toUpperCase()}`] = data.id
  } else {
    let stock = { idType: 'EAN', stockMap: {} }
    stock.stockMap[data.id] = {
      quantity: data.quantity,
      condition: data.condition || ''
    }
    body.doc.stocks[warehouse] = stock
  }
  return body
}