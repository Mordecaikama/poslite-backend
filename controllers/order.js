const { Order } = require('../models/order')
const mongoose = require('mongoose')
const Table = require('../models/table')
const Organisation = require('../models/organisation')
const { ObjectId } = mongoose.Types
const handleErrors = (err) => {
  let error = {
    table: '',
  }

  // incorrect email
  if (err.message === 'incorrect pin') {
    error.pin = 'pin is wrong'
    return error
  }

  if (err.code === 11000) {
    error.email = 'this user email already exists'
    return error
  }

  if (err.message.includes('Order validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message
    })
  }

  return error
}

exports.orderById = (req, res, next, id) => {
  // console.log('orders', id)
  Order.findById(id).exec((err, order) => {
    if (err || !order) {
      return res.status(400).json({
        error: 'No Order found',
      })
    }
    // console.log(order)
    req.order = order
    next()
  })
}

exports.create = (req, res, next) => {
  // console.log(req.body)
  // req.body.order.user = req.profile
  req.body.createdAt = new Date()
  // .toISOString().slice(0, 10)
  // const wt = new Date.split('T')[0]
  // console.log(new Date().toISOString().slice(0, 10))
  const order = new Order(req.body)
  order.save((error, data) => {
    if (error) {
      const err = handleErrors(error)
      return res.json({
        error: err,
      })
    }
    req.order = data
    next()
  })
}

exports.remove = (req, res) => {
  // console.log(JSON.stringify(req.body))
  let order = req.order
  order.remove((err, doc) => {
    if (err) {
      res.status(400).json({
        error: 'Order couldnt be deleted',
      })
    }
    res.json({ data: true })
  })
}

exports.listOrders = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10
  // let skip = req.body.skip ? parseInt(req.body.limit) : 0
  const skip = parseInt(req.body.skip) * limit
  const op = Object.keys(req.body.operator).length //checks if operator

  var filter = {}

  if (op) {
    filter.operator = ObjectId(req.body.operator.toString())
  }

  if (req.body.dates.length < 2) {
    // or whatever condition you need
    const dte = new Date(req.body.dates[0])

    filter.createdAt = { $gte: dte }
  } else {
    filter.createdAt = {
      $gte: new Date(req.body.dates[0]),
      $lte: new Date(req.body.dates[1]),
    }
  }

  // console.log('filter', req.body.dates)

  // Organisation.find({
  //   _id: req.organisation._id,
  // })
  //   .select('orders')
  //   .populate({
  //     path: 'orders',
  //     select: '-updatedAt',
  //     populate: {
  //       path: 'operator',
  //       select: 'name',
  //     },
  //     match: filter,
  //     options: {
  //       skip: skip,
  //       limit: limit,
  //       sort: { createdAt: -1 },
  //     },
  //   })
  //   .exec((err, ord) => {
  //     if (err) {
  //       return res.status(400).json({
  //         error: 'Orders not found',
  //       })
  //     }
  //     // console.log(ord)

  //     res.send({ data: ord })
  //   })

  var pipeline = [
    { $match: { _id: req.organisation._id } },
    { $project: { orders: 1 } },
    {
      $lookup: {
        from: 'orders',
        localField: 'orders',
        foreignField: '_id',
        as: 'orders',
      },
    },
    { $unwind: { path: '$orders' } },
    { $replaceRoot: { newRoot: '$orders' } },
    // { $match: { createdAt: { $gte: new Date() } } },

    {
      $facet: {
        totalData: [
          { $match: filter },
          { $skip: skip },
          { $limit: limit },
          { $sort: { createdAt: req.body.createdAt === 'asc' ? 1 : -1 } },
          {
            $project: {
              products: 1,
              amount: 1,
              tax: 1,
              table: 1,
              status: 1,
              paytype: 1,
              operator: 1,
              customer: 1,
              createdAt: 1,
            },
          },
        ],
        pagination: [{ $count: 'total' }],
      },
    },
  ]

  Organisation.aggregate(pipeline).exec((err, doc) => {
    if (err || !doc) {
      return res.status(400).json({
        error: 'No Orders found',
      })
    }
    // console.log(doc)
    res.json({ data: doc })
  })
}
exports.OrdersGraph = (req, res) => {
  // console.log('query ', req.query, 'body ', req.body)

  const op = Object.keys(req.body.operator).length //checks if operator

  var filter = {}

  if (op) {
    filter.operator = ObjectId(req.body.operator.toString())
  }

  if (req.body.dates.length < 2) {
    filter.createdAt = { $gte: new Date(req.body.dates[0]) }
  } else {
    filter.createdAt = {
      $gte: new Date(req.body.dates[0]),
      $lte: new Date(req.body.dates[1]),
    }
  }

  var pipeline = [
    { $match: { _id: req.organisation._id } },
    { $project: { orders: 1 } },
    {
      $lookup: {
        from: 'orders',
        localField: 'orders',
        foreignField: '_id',
        as: 'orders',
      },
    },
    { $unwind: { path: '$orders' } },
    { $replaceRoot: { newRoot: '$orders' } },
    {
      $facet: {
        totalData: [{ $match: filter }, { $sort: { createdAt: 1 } }],
        pagination: [{ $count: 'total' }],
      },
    },
  ]

  Organisation.aggregate(pipeline).exec((err, doc) => {
    if (err || !doc) {
      return res.status(400).json({
        error: 'No Orders found',
      })
    }

    res.json({ data: doc })
  })
}

exports.operatorOrders = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate('user', '_id name address')
    .sort('-created')
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: 'orders not found',
        })
      }
      res.json({ data: orders })
    })
}

exports.getStatusValues = (req, res) => {
  res.json({ data: Order.schema.path('status').enumValues })
}

exports.updateOrderStatus = (req, res) => {
  // console.log('body ', req.body)

  Order.updateOne(
    { _id: req.order._id },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({
          error: 'Order Status failed to update',
        })
      }
      res.json({ data: 'successful' })
    }
  )
}

exports.updateTableOrder = (req, res, next) => {
  // middleware for addtoorder and updateorder
  // checks addtoorder if it container orderstatus and sets table to checkedIn
  // checks updateorder if it is delivered and resets table
  const { orderstatus, ...rest } = req.body
  let status = { ...rest, status: orderstatus }

  let tb = req.body.table ? req.body.table : req.body.order.table
  let det =
    req.body.status === 'Delivered' || req.body.status === 'Cancelled'
      ? { status: 'free', time: '-', customer: '' }
      : status

  // console.log('body ', tb, 'details ', det)

  Table.updateOne({ name: tb }, { $set: det }, { new: true }, (err, order) => {
    if (err) {
      // console.log('error ', err)
      return res.json({
        error: 'Table failed to update',
      })
    }

    // console.log(order)

    next()
    // res.json({ data: 'successful' })
  })
}

exports.updateTableBefDel = (req, res, next) => {
  // checks to update table before delete

  let tb = req.order.table
  let det = { status: 'free', time: '-', customer: '' }

  // console.log('body ', tb, 'details ', det)

  Table.updateOne({ name: tb }, { $set: det }, { new: true }, (err, order) => {
    if (err) {
      return res.json({
        error: 'Table failed to update',
      })
    }

    next()
  })
}

exports.ordersOverview = (req, res) => {
  // console.log('pipeline')
  // let filter = req.query.status === 'all' ? {} : req.query
  // console.log('body ', req.body)

  const op = Object.keys(req.body.operator).length //checks if operator

  // console.log('something')
  var filter = {}

  if (op) {
    filter.operator = ObjectId(req.body.operator.toString())
  }

  if (req.body.dates.length < 2) {
    // or whatever condition you need
    // filter.$gte = req.body?.dates[0]
    filter.createdAt = { $gte: new Date(req.body.dates[0]) }
  } else {
    filter.createdAt = {
      $gte: new Date(req.body.dates[0]),
      $lte: new Date(req.body.dates[1]),
    }
  }

  // console.log(filter)

  var pipeline = [
    {
      $match: { _id: req.organisation._id },
    },
    { $project: { orders: 1 } },
    {
      $lookup: {
        from: 'orders',
        localField: 'orders',
        foreignField: '_id',
        as: 'orders',
      },
    },
    { $unwind: { path: '$orders' } },
    { $replaceRoot: { newRoot: '$orders' } },
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    // { $match: { operator: req.profile._id } },
    // { $group: { _id: '$status', count: { $sum: 1 } } },
  ]

  Organisation.aggregate(pipeline).exec((err, data) => {
    if (err || !data) {
      res.json({ data: 'No Orders found' })
    }
    // console.log(data)
    res.json({ data })
  })
}

exports.removeSeletedOrders = (req, res) => {
  // console.log(req.body, 'main')
  Order.deleteMany({ _id: { $in: req.body } }, (err, data) => {
    if (err || !data) {
      return res.status(400).json({
        error: 'No products found',
      })
    }
    res.json({ data: 'successful' })
  })
}

// middleware to delete selected array of voters from election
exports.removeBulkordersfromOrganisation = (req, res, next) => {
  const oid = req.organisation._id.toString()

  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { orders: { $in: req.body } } }
    // { new: true }
  ).exec((err, data) => {
    if (err) {
      res.json({ error: err })
      // console.log(err)
    }

    next()
  })
}
