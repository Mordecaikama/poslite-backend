const Table = require('../models/table')
const Organisation = require('../models/organisation')

const handleErrors = (err) => {
  let error = {
    name: '',
  }

  if (err.code === 11000) {
    error.name = 'Table name is unavailable'
    return error
  }

  if (err.message.includes('User validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message
    })
  }
  return error
}

exports.tableId = (req, res, next, id) => {
  console.log('tables', id)
  Table.findById(id).exec((err, table) => {
    if (err || !table) {
      return res.status(400).json({
        error: 'No Table found',
      })
    }
    // console.log(order)
    req.table = table
    next()
  })
}

exports.checkStatus = (req, res) => {
  res.json({ data: true })
}

exports.create = (req, res, next) => {
  // console.log(req.body)
  // req.body.order.user = req.profile

  // console.log(typeof req.body.name, req.body.name)
  const table = new Table(req.body)
  table.save((err, data) => {
    if (err) {
      const errors = handleErrors(err)
      return res.json({
        errors,
      })
    }
    req.table = data
    next()
  })
}

exports.listTablebySearch = (req, res) => {
  Organisation.find({
    _id: req.organisation._id,
  })
    .select('tables')
    .populate({
      path: 'orders',
      select: ' -status',
      match: {
        status: req.body.status,
      },
    })
    .exec((err, ord) => {
      if (err) {
        // console.log(err)
        return res.status(400).json({
          error: 'Tables not found',
        })
      }
      // console.log(ord)
      res.send({ data: ord })
    })
}

exports.listTables = (req, res) => {
  let sortBy = req.query.sortBy ? req.query.sortBy : 1

  let filter = req.query.status === 'all' ? {} : req.query

  // console.log(filter)

  Organisation.find({ _id: req.organisation._id })
    .select('tables')
    .populate({
      path: 'tables',
      match: filter,
      options: {
        sort: { time: sortBy },
      },
    })
    .exec((err, ord) => {
      if (err) {
        return res.status(400).json({
          error: 'Tables not found',
        })
      }
      // console.log(ord)
      res.send({ data: ord })
    })
}

exports.getStatusValues = (req, res) => {
  res.json({ data: Table.schema.path('status').enumValues })
}

exports.remove = (req, res) => {
  let table = req.table
  table.remove((err, doc) => {
    if (err) {
      res.status(400).json({
        error: 'Order could not be deleted',
      })
    }
    res.json({ data: true })
  })
}

exports.updateTable = (req, res) => {
  Table.findOneAndUpdate(
    { _id: req.table.id },
    { $set: req.body },
    { new: true },
    (err, order) => {
      if (err) {
        return res.json({
          error: 'Table failed to update',
        })
      }
      res.json({ data: 'successful' })
    }
  )
}

exports.tableOverview = (req, res) => {
  var pipeline = [
    {
      $match: { _id: req.organisation._id },
    },
    { $project: { tables: 1 } },
    {
      $lookup: {
        from: 'tables',
        localField: 'tables',
        foreignField: '_id',
        as: 'tables',
      },
    },
    { $unwind: { path: '$tables' } },
    { $replaceRoot: { newRoot: '$tables' } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]

  Organisation.aggregate(pipeline).exec((err, data) => {
    if (err || !data) {
      res.json({ data: 'No tables found' })
    }
    res.json({ data })
  })
}

exports.removeTablefromOrganisation = (req, res, next) => {
  const table = req.table
  const organi = req.organisation
  const tid = table._id.toString()
  const oid = organi._id.toString()
  // console.log(table, oid, req.params)

  Organisation.findOneAndUpdate({ _id: oid }, { $pull: { tables: tid } }).exec(
    (err, data) => {
      if (err) {
        res.json({ err })
      }
      next()
    }
  )
}

// { $in: { candidates: candidate._id } },
// { new: true }
