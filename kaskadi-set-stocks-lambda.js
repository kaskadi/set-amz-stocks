const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  const body = await createBulkBody(event)
  await es.bulk({
    refresh: true,
    body
  }).then(res => {console.log(JSON.stringify(res, null, 2))}).catch(err => {console.log(JSON.stringify(err, null, 2))})
}

async function createBulkBody(event) {
  const transformedStockData = await transformStockData(event)
  return transformedStockData.flatMap(processStockData(event)).concat([
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

async function transformStockData({stockData, warehouse, idType}) {
  if (idType === 'ASIN') {
    let searchBody = { from: 0, size: 5000, query: { match: {} } }
    searchBody.query.match[`asin.${warehouse}`] = stockData.map(data => data.id).join(' ')
    const searchData = await es.search({ index: 'products', body: searchBody })
    stockData = searchData.body.hits.hits.map(doc => {
      return {
        ...stockData.filter(data => doc._source.asin[warehouse].includes(data.id))[0],
        docId: doc._id
      }
    })
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

function processStockData({stockData, warehouse, idType}) {
  return data => {
    let body = { doc: { stocks: {} } }
    body.doc.stocks[warehouse] = {
      idType,
      stockData
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