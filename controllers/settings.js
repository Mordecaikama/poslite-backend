const fs = require('fs')
const { cachedDataVersionTag } = require('v8')

// read only json files please
exports.readfile = (req, res) => {
  fs.readFile('settings.json', (err, data) => {
    // console.log(data)
    const doc = JSON.parse(data)
    res.json({ doc })
  })
}

// read json configfile middleware to election
exports.readConfigfilemiddleware = (req, res, next) => {
  fs.readFile('./uploads/settings/settings.json', (err, data) => {
    if (data) {
      const doc = JSON.parse(data)
      req.appconfig = doc
      next()
    }
  })
}

// read json pricingfile middleware to election
exports.readPricingfilemiddleware = (req, res, next) => {
  fs.readFile('./uploads/settings/pricing.json', (err, data) => {
    if (data) {
      const doc = JSON.parse(data)
      req.priceconfig = doc
      next()
    }
  })
}

exports.writefile = (req, res) => {
  const data = JSON.stringify(req.body, null, 2)

  fs.writeFile('settings.json', data, (err, data) => {
    if (err) {
      res.json({ err })
    }
    res.json({ data })
  })
}
