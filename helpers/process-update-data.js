module.exports = ({warehouse, idType}) => {
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