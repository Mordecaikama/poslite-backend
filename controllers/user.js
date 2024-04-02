const User = require('../models/User')
const Organisation = require('../models/organisation')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')

const maxAge = 60 * 4320
const createToken = (id) => {
  return jwt.sign({ id }, process.env.jt, {
    expiresIn: '20m',
  })
}

const handleErrors = (err) => {
  let error = {
    name: '',
    email: '',
    telephone: '',
    dob: '',
    password: '',
    admin: '',
    acc: '',
  }

  // incorrect email
  if (err.message === 'incorrect email') {
    error.email = 'Email is not registered'
    return error
  }
  if (err.message === 'incorrect password') {
    error.password = 'incorrect password'
    return error
  }

  if (err.message === 'Account not Verified') {
    error.acc = 'Account not Verified'
    return error
  }

  if (err.code === 11000) {
    error.email = 'this email is taken'
    return error
  }

  if (err.message.includes('User validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message
    })
  }
  return error
}

const userById = (req, res, next, id) => {
  // console.log(id, 'userById')
  User.findById(id)
    .select('name email img permission')
    .exec((err, user) => {
      if (err || !user) {
        // console.log(err, id)
        return res.status(400).json({ error: 'User nothing not found' })
      }
      // console.log('user')
      req.profile = user
      next()
    })
}

const create_User = (req, res, next) => {
  var pimg
  if (!req.file) {
    pimg = 'default.png'
  } else {
    pimg = req.file.filename
  }
  req.body.img = pimg

  const user = new User(req.body)
  user.save((err, data) => {
    if (err) {
      const errors = handleErrors(err)
      res.json({ err: errors })
    } else {
      req.profile = data
      next()
    }
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

  const operator = new User(req.body)
  operator.save((err, doc) => {
    if (err) {
      const errors = handleErrors(err)
      res.json({ errors })
    } else {
      Organisation.findOneAndUpdate(
        { _id: req.organisation._id },
        { $push: { users: doc } },
        { new: true }
      ).exec((error, data) => {
        if (error) {
          return res.status(400).json({
            error: 'Could not save user to Organisation',
          })
        }
        res.json({ data: true })
      })
    }
  })
}

const get_User = async (req, res) => {
  // a user logsin to an organisational portal
  const { email, password } = req.body
  // console.log('user ', email, password, ' attempting to login')

  try {
    const user = await User.login(email, password)
    // console.log('user', user)
    const token = createToken(user._id)
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      // sameSite: 'None',
    })
    if (user) {
      Organisation.find()
        .populate({ path: 'users', match: { users: user._id } })
        .select('_id users ')
        .exec((err, doc) => {
          if (err || !doc) {
            res.status(400).json({ errors: 'No User found' })
          }
          // console.log(doc, user)

          res.status(200).send({
            data: { token, data: { _id: doc[0]._id, user: user?._id } },
          })
        })
    }
  } catch (error) {
    // console.log(error)
    const errors = handleErrors(error)
    res.send({ errors })
  }
}

// verifies email to be true after code is entered
const verifyEmail = async (req, res) => {
  const { email } = req.body

  // checks to find operator, if not find from user

  User.findOne({ email })
    .select('permission ')
    .exec((err, user) => {
      if (err || !user) {
        res.json({ errors: { email: 'User Does not exist', status: true } })
      } else {
        //gets operator info and organi info from organsation

        res.status(200).send({
          data: { type: user.permission },
        })
      }
    })
}

const requireSignIn = expressJwt({
  secret: process.env.jt,
  userProperty: 'auth',
  algorithms: ['HS256'],
})

const isAuth = (req, res, next) => {
  // console.log(req.auth)
  // res.send('me')
  // console.log(req.auth, 'auth', req.profile)
  let user = req.profile && req.auth && req.profile._id == req.auth.id
  if (!user) {
    return res.status(403).json({
      error: 'Access denied is auth',
    })
  }
  next()
}

const isAdmin = (req, res, next) => {
  if (req.profile.permission != 'admin') {
    return res.status(403).json({
      error: 'Admin resource! Access denied',
    })
  }
  next()
}

const getUsers = async (req, res) => {
  // gets organisation data and populate operators then pushes to operatos tab

  // req.query == {permission:'operator/admin/user'}
  // console.log(req.organisation, 'query ', req.query)
  // res.json({ data: 'msg' })
  Organisation.findById({ _id: req.organisation._id })
    .populate({
      path: 'users',
      select: 'name email img',
      match: req.query,
    })
    .select('users')
    .exec((err, operators) => {
      if (err || !operators) {
        return res.status(400).json({
          error: 'No operators found',
        })
      }
      console.log(operators)
      res.json({ data: operators })
    })
}

const updateUser = async (req, res) => {
  var pimg
  if (req.file) {
    pimg = req.file.filename
    req.body.img = pimg
  }
  if (req.body.password) {
    const hashedPassword = await hashPassword(req.body.password)
    req.body.password = hashedPassword
  }
  // console.log(req.profile)
  const { _id, ...rest } = req.profile
  User.findOneAndUpdate(
    { _id: _id },
    { $set: req.body },
    { new: true },
    (err, doc) => {
      if (err) {
        return res.status(400).json({
          error: 'User could not be updated',
        })
      }
      res.json({ data: true })
    }
  )
}

const removeUser = (req, res) => {
  User.remove({ _id: req.query._id }, (err, doc) => {
    if (err) {
      res.status(400).json({
        error: 'User couldnt be deleted',
      })
    }
    res.json({ data: true })
  })
}

const removeUserfromOrganisation = (req, res, next) => {
  const user = req.profile
  const organi = req.organisation
  const opid = user._id.toString()
  const oid = organi._id.toString()
  // console.log(oid, req.body)
  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { users: req.query._id } }
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
  User.deleteMany({ _id: { $in: req.body } }, (err, data) => {
    if (err || !data) {
      // console.log(err)
      return res.status(400).json({
        error: 'No operators found',
      })
    }
    res.json({ data: 'successful' })
  })
}

const removeBulkUserfromOrganisation = (req, res, next) => {
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

const getProfile = (req, res) => {
  res.json({ data: req.profile })
}

const logout = (req, res) => {
  res.cookie('jwt', '', { expires: new Date(0) })
  res.send({ data: true })
}

module.exports = {
  requireSignIn,
  userById,
  create_User,
  get_User,
  getUsers,
  isAuth,
  isAdmin,
  verifyEmail,
  logout,
  updateUser,
  removeUser,
  removeUserfromOrganisation,
  removeSeletedops,
  removeBulkUserfromOrganisation,
  createOperator,
  getProfile,
}
