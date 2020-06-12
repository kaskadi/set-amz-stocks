const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  await es.bulk({
    refresh: true,
    body: await createBulkBody(event)
  }).then(res => {console.log(JSON.stringify(res, null, 2))}).catch(err => {console.log(JSON.stringify(err, null, 2))})
}

async function createBulkBody(event) {
  const updateData = await getUpdateData(event)
  const { warehouse } = event
  return updateData.flatMap(processUpdateData(event)).concat([
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

async function getUpdateData({stockData, warehouse, idType}) {
  if (idType === 'ASIN') {
    stockData = await getStockDataForAsins(stockData, warehouse)
  } else {
    stockData = stockData.map(data => {
      return {
        ...data,
        docId: data.id
      }
    })
  }
  return stockData
}

async function getStockDataForAsins(stockData, warehouse) {
  let searchBody = { from: 0, size: 5000, query: { match: {} } }
  searchBody.query.match[`asin.${warehouse}`] = stockData.map(data => data.id).join(' ')
  const searchData = await es.search({ index: 'products', body: searchBody })
  return searchData.body.hits.hits.map(doc => {
    const newStockData = stockData
    const currentStockData = doc._source.stocks[warehouse].stockData
    return {
      stockData: [...newStockData, ...currentStockData.filter(stockData => !newStockData.map(data => data.id).includes(stockData.id))],
      docId: doc._id
    }
  })
}

function processUpdateData({warehouse, idType}) {
  return data => {
    let body = { doc: { stocks: {} } }
    body.doc.stocks[warehouse] = {
      idType,
      stockData: data.stockData
    }
    return [
      {
        update: {
          _id: data.docId,
          _index: 'products',
          retry_on_conflict: 3
        }
      },
      body
    ]
  }
}