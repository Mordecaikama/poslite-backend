const { Order } = require('../models/order')
const Table = require('../models/table')
const Organisation = require('../models/organisation')

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
  let limit = req.query.limit ? parseInt(req.query.limit) : 10
  // let todaysdate = req.body.date ? req.body.filter.date : new Date()
  // console.log(todaysdate)
  // console.log(req.body)

  // let filter = req.body.operator === 'operator'

  // console.log(req.body)

  Organisation.find({
    _id: req.organisation._id,
  })
    .select('orders')
    .populate({
      path: 'orders',
      select: '-updatedAt',
      populate: {
        path: 'operator',
        select: 'name',
      },
      match: {
        operator: req.body.operator,
        createdAt: { $gte: req.body.date },
      },
      // createdAt: new Date('2023-11-18T00:00:00.000+0000'),
      // createdAt: { $gte: req.body.date },
      // },
      options: {
        limit: limit,
        sort: { createdAt: -1 },
      },
    })
    .exec((err, ord) => {
      if (err) {
        // console.log(err)
        return res.status(400).json({
          error: 'Orders not found',
        })
      }
      // console.log(ord)
      res.send({ data: ord })
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
  // console.log('body ', status, req.body)
  let det =
    req.body.status === 'Delivered' || req.body.status === 'Cancelled'
      ? { status: 'free', time: '-', customer: '' }
      : status

  Table.updateOne({ name: tb }, { $set: det }, { new: true }, (err, order) => {
    if (err) {
      console.log(err)
      return res.json({
        error: 'Table failed to update',
      })
    }

    next()
    // res.json({ data: 'successful' })
  })
}
