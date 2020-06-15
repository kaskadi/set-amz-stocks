module.exports = async ({stockData, warehouse, idType}) => {
  if (idType === 'ASIN') {
    stockData = await searchAllProducts(stockData, warehouse).map(doc => {
      const newStockData = stockData.filter(data => doc._source.asin[warehouse].includes(data.id))
      const currentStockData = doc._source.stocks[warehouse] ? doc._source.stocks[warehouse].stockData : []
      return {
        stockData: [...newStockData, ...currentStockData.filter(stockData => !newStockData.map(data => data.id).includes(stockData.id))],
        docId: doc._id
      }
    })
  } else {
    stockData = stockData.map(data => {
      return {
        stockData: [data],
        docId: data.id
      }
    })
  }
  return stockData
}

async function searchAllProducts(stockData, warehouse) {
  let from = 0
  const size = 500
  let searchBody = { from: 0, size: 5000, query: { match: {} } }
  searchBody.query.match[`asin.${warehouse}`] = stockData.map(data => data.id).join(' ')
  const searchResult = await searchProducts(from, size, searchBody)
  let dbData = searchResult.body.hits.hits
  while (from < searchResult.body.hits.total.value - size) {
    from += size
    dbData = dbData.concat((await searchProducts(from, size, searchBody)).body.hits.hits)
  }
  return dbData
}

function searchProducts(from, size, searchBody) {
  return es.search({
    index: 'products',
    from,
    size,
    body: searchBody
  })
}