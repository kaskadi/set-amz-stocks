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
  return processStockData(stockData, warehouse, provider).concat([
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

function processStockData(stockData, warehouse, provider) {
  return stockData.flatMap(data => {
    let op = {
      update: {
        _id: data.id,
        _index: 'products'
      }
    }
    let body = {}
    const stockInfo = {
      amount: data.quantity,
      condition: data.condition || ''
    }
    if (provider === 'amz') {
      op = {
        updateByQuery: {
          _index: 'products',
          _refresh: true
        }
      }
      body = {
        script: {
          lang: 'painless',
          source: `ctx._source['stocks'][${warehouse}] = { asin: ${data.id}, stock: ${JSON.stringify(stockInfo)} }`
        },
        query: {
          filtered: {
            filter: {
              term: {}
            }
          }
        }
      }
      body.query.filtered.filter.term[`asin.${warehouse.split('_')[1].toUpperCase()}`] = data.id
    } else {
      body = {
        doc: {
          stocks: {}
        }
      }
      body.doc.stocks[warehouse] = stockInfo
    }
    return [op, body]
  })
}