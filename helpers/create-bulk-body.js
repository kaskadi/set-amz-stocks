module.exports = (updateData, processUpdateDataHandler, event) => {
  return updateData.flatMap(processUpdateDataHandler(event)).concat([
    {
      update: {
        _id: event.warehouse,
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