module.exports = body => {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  return es.bulk({
    refresh: true,
    body
  })
}
