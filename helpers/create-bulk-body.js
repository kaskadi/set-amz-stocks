module.exports = stockData => {
  return stockData.flatMap(buildMarketplaceBulk)
}

function buildMarketplaceBulk ({ marketplace, marketplaceStockData }) {
  const warehouse = `amz_${marketplace.toLowerCase()}`
  return getStockBulkBody(warehouse, marketplaceStockData).concat(getWarehouseBulkBody(warehouse))
}

function getStockBulkBody (warehouse, marketplaceStockData) {
  return marketplaceStockData.flatMap(getOpBodyDuplet(warehouse))
}

function getOpBodyDuplet (warehouse) {
  return data => {
    const op = {
      update: {
        _id: data.ean,
        _index: "products"
      }
    }
    let body = { doc: { stocks: {} } }
    body.doc.stocks[warehouse] = data.eanStockData.map(eanData => {
      return {
        asin: eanData.asin,
        stockData: eanData.asinStockData
      }
    })
    return [op, body]
  }
}

function getWarehouseBulkBody (warehouse) {
  return [
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
  ]
}
