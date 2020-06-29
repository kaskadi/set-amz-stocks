module.exports = ({ marketplace, marketplaceStockData }) => {
  const warehouse = `amz_${marketplace.toLowerCase()}`
  return getStockBulkBody(warehouse, marketplaceStockData).concat(getWarehouseBulkBody(warehouse))
}

function getStockBulkBody (warehouse, marketplaceStockData) {
  return marketplaceStockData.flatMap(data => [
    {
      update: {
        _id: data.ean,
        _index: "products"
      }
    },
    {
      doc: {
        stocks: {
          warehouse,
          stockData: data.eanStockData
        }
      }
    }
  ])
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