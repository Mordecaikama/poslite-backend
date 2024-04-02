const Operator = require('../models/operator')
const Organisation = require('../models/organisation')
const jwt = require('jsonwebtoken')

const handleErrors = (err) => {
  let error = {
    pin: '',
    email: '',
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

  if (err.message.includes('Operator validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message
    })
  }

  return error
}

const operatorById = (req, res, next, id) => {
  // console.log(id, 'operatorById')
  Operator.findById(id).exec((err, operator) => {
    if (err || !operator) {
      // console.log(err)
      return res.json({ error: 'Operator not found' })
    }
    // console.log(operator)
    req.operator = operator
    next()
  })
}

const maxAge = 60 * 4320
const createToken = (id) => {
  return jwt.sign({ id }, process.env.jt, {
    expiresIn: '2h',
  })
}

const createOperator = (req, res, next) => {
  // saves operator info and then saves id to organisation

  var pimg
  if (!req.file) {
    pimg = 'default.png'
  } else {
    pimg = req.file.filename
  }
  req.body.img = pimg
  // console.log(req.body)
  const operator = new Operator(req.body)
  operator.save((err, doc) => {
    if (err) {
      // console.log(err)
      const errors = handleErrors(err)
      res.json({ errors })
    } else {
      Organisation.findOneAndUpdate(
        { _id: req.organisation._id },
        { $push: { operators: doc } },
        { new: true }
      ).exec((error, data) => {
        if (error) {
          return res.status(400).json({
            error: 'Could not save operator to Organisation',
          })
        }
        res.json({ data: true })
      })
    }
  })
}

const getOperator = async (req, res) => {
  // a user logsin to an organisational portal
  const { id, pin } = req.body
  const opera = req.operator
  const organi = req.organisation
  // const opid = operator._id.toString()
  // const oid = organi._id.toString()

  try {
    const operator = await Operator.login(id, pin)
    const token = createToken(opera._id)
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    })
    // console.log(operator, 'operator found')
    if (operator) {
      res.status(200).send({ data: true, token })
    }
  } catch (error) {
    console.log(error)
    const errors = handleErrors(error)
    res.send({ errors })
  }
}

const getOperators = async (req, res) => {
  // gets organisation data and populate operators then pushes to operatos tab
  Organisation.findById({ _id: req.organisation._id })
    .populate({
      path: 'operators',
      select: 'name email img',
    })
    .select('operators')
    .exec((err, operators) => {
      if (err || !operators) {
        return res.status(400).json({
          error: 'No operators found',
        })
      }
      res.json({ data: operators })
    })
}

const updateOperator = async (req, res) => {
  var pimg
  if (req.file) {
    pimg = req.file.filename
    req.body.img = pimg
  }
  if (req.body.pin) {
    const hashedPassword = await hashPassword(req.body.pin)
    req.body.pin = hashedPassword
  }
  const { _id, ...rest } = req.operator
  Operator.findOneAndUpdate(
    { _id: _id },
    { $set: req.body },
    { new: true },
    (err, doc) => {
      if (err) {
        return res.status(400).json({
          error: 'Operator could not be updated',
        })
      }
      res.json({ data: true })
    }
  )
}

const removeOperator = (req, res) => {
  let operator = req.operator
  operator.remove((err, doc) => {
    if (err) {
      res.status(400).json({
        error: 'Operator couldnt be deleted',
      })
    }
    res.json({ data: true })
  })
}

const removeOperatorfromOrganisation = (req, res, next) => {
  const operator = req.operator
  const organi = req.organisation
  const opid = operator._id.toString()
  const oid = organi._id.toString()
  // console.log(oid, eid)
  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { operators: opid } }
    // { new: true }
  ).exec((err, data) => {
    if (err) {
      res.json({ err })
    }
    // res.json({ data })
    next()
  })
  // res.json({ dt: 'not' })
  // next()
}

const removeSeletedops = (req, res) => {
  // console.log(req.body, 'main')
  Users.deleteMany({ _id: { $in: req.body } }, (err, data) => {
    if (err || !data) {
      // console.log(err)
      return res.status(400).json({
        error: 'No Users found',
      })
    }
    res.json({ data: 'successful' })
  })
}
//launch election

// middleware to delete selected array of voters from election
const removeBulkopsfromOrganisation = (req, res, next) => {
  const oid = req.organisation._id.toString()
  // console.log(req.body, 'something here')
  // res.json({ error: 'error' })

  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { users: { $in: req.body } } }
    // { new: true }
  ).exec((err, data) => {
    if (err) {
      res.json({ error: err })
      // console.log(err)
    }

    // res.json({ data: 'success' })
    next()
  })
}

module.exports = {
  removeOperator,
  updateOperator,
  operatorById,
  createOperator,
  getOperator,
  getOperators,
  removeOperatorfromOrganisation,
  removeSeletedops,
  removeBulkopsfromOrganisation,
}
