const User = require('../models/User')
const Organisation = require('../models/organisation')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
var { nanoid } = require('nanoid')
const { transporter } = require('../helpers/nodeMail')
const { hashPassword } = require('../helpers/auth')
require('dotenv').config()
const ejs = require('ejs')

const maxAge = 60 * 4320
const createToken = (id) => {
  return jwt.sign({ id }, process.env.jt, {
    expiresIn: '6h',
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
    .select('name email img permission cart')
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
  req.body.permission = 'admin'
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

  const user = new User(req.body)
  user.save((err, doc) => {
    if (err) {
      const errors = handleErrors(err)
      res.json({ errors })
    } else {
      req.user = user
      next()
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
    // console.log('user ', user)
    if (user) {
      Organisation.find({ users: { $elemMatch: { $eq: user._id } } })
        .select('_id users ')
        .exec((err, doc) => {
          if (err || !doc) {
            res.status(400).json({ errors: 'No User found' })
          }

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
const verifyEmailCode = async (req, res) => {
  const { pin } = req.body

  console.log(req.body)

  User.findOne({ code: req.body.pin })
    .then((user) => {
      if (!user) {
        res.json({ errors: 'Wrong Verification Code' })
      } else {
        // if codetime not expired update verification and account
        if (!user.codetime_exp) {
          User.findOneAndUpdate(
            { code: pin },
            {
              $set: {
                code: '',
                acc_setup: true,
                acc_verify_at: new Date().getTime(),
                codetime_exp: false,
              },
            },
            { new: true },
            async (err, user) => {
              if (err) {
                return res
                  .status(400)
                  .json({ errors: 'soemthing dey go on has expired' })
              } else {
                res.json({ msg: 'successful' })
              }
            }
          )
        } else {
          res.json({ errors: 'Code has Expired' })
        }
      }
    })
    .catch((error) => {
      // console.log('from catch area ', error)
      res.json({ errors: 'Code has Expired' })
    })
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
      error: 'Access denied',
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
  const permType = req.query.permission
  // gets organisation data and populate operators then pushes to operatos tab
  // console.log(req.query)

  Organisation.findById({ _id: req.organisation._id })
    .populate({
      path: 'users',
      select: 'name email img',
      match: { permission: permType },
    })
    .select('users')
    .exec((err, operators) => {
      if (err || !operators) {
        return res.status(400).json({
          error: 'No operators found',
        })
      }
      // console.log(operators)
      res.json({ data: operators })
    })
}

const getOperators = async (req, res) => {
  const limit = parseInt(req.query.limit)
  const skip = parseInt(req.query.skip) * limit
  const permType = req.query.permission
  var pipeline = [
    { $match: { _id: req.organisation._id } },
    { $project: { users: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'users',
        foreignField: '_id',
        as: 'users',
      },
    },
    { $unwind: { path: '$users' } },
    { $replaceRoot: { newRoot: '$users' } },
    {
      $facet: {
        totalData: [
          { $match: { permission: permType } },
          { $project: { name: 1, email: 1, img: 1, acc_setup: 1 } },

          { $skip: skip },
          { $limit: limit },
          { $sort: { createdAt: 1 } },
        ],
        pagination: [{ $count: 'total' }],
      },
    },
  ]

  Organisation.aggregate(pipeline).exec((err, doc) => {
    if (err || !doc) {
      console.log(err)
      return res.status(400).json({
        error: 'No Users found',
      })
    }

    res.json({ data: doc })
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

const checkOldpassword = async (req, res) => {
  // const user = req.profile
  // hash user password and compare with db password
  const { old, newpass } = req.body
  const hashedPassword = await hashPassword(newpass)

  try {
    const user = await User.login(req.profile.email, old)
    if (user) {
      req.body.password = hashedPassword // changes old to new
      User.findOneAndUpdate(
        { _id: req.profile._id },
        { $set: req.body },
        {
          new: true,
          select: { name: 1, email: 1 },
        },

        (err, doc) => {
          if (err) {
            return res.status(400).json({
              error: 'user could not be updated',
            })
          }

          res.json({ data: doc })
        }
      )
    }
  } catch (error) {
    const errors = handleErrors(error)
    res.send({ errors })
  }

  // throw Error('incorrect email')
}

const setUpOpAccount = async (req, res, next) => {
  // when op sets passwd accout is setup
  // middleware to setup account
  const user = req.profile

  User.findOneAndUpdate(
    { _id: user?._id },
    {
      $set: {
        acc_setup: true,
      },
    },
    { new: true },
    async (err, user) => {
      if (err) {
        return res.status(400).json({ errors: 'User does not exist' })
      } else {
        next()
      }
    }
  )
}

const setUpOpEmail = async (req, res, next) => {
  const data = await ejs.renderFile('./views/operatoremail.ejs', {
    username: req.user.name,
    address: `https://localhost:3000/confirmOperator/${req.organisation._id}/${req.user._id}`,
    orgName: req.organisation.name, //organisation name
  })

  const emailData = {
    from: process.env.Nodemailer_email,
    to: req.user.email,
    subject: `Complete Your Account Setup With ${req.organisation.name}`,
    html: data,
    // <span style="color:red"> ${resetCode}</span>
  }
  // send email
  // console.log('env ', process.env.Nodemailer_email)
  transporter.sendMail(emailData, (err, data) => {
    // console.log(err, data)
    if (err) {
      res.json({
        errors: false,
        err,
      })
    } else {
      console.log('successfully sent')
      next()
    }
  })
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

// generate email code for verification
const confirmEmailCode = async (req, res, next) => {
  const user = req.profile

  // generate code
  const emailCode = nanoid(5).toUpperCase()

  // ten minuetes ahead
  var current = new Date().getTime()
  var ten_minutes_from_now = current + 600000

  User.findOneAndUpdate(
    { email: user.email },
    { $set: { code: emailCode } },
    { new: true },
    async (err, user) => {
      if (err) {
        return res.status(400).json({ errors: 'User not found' })
      } else {
        const timers = setTimeout(
          () =>
            User.findOne({ email: user.email }).then((us) => {
              if (!us?.accsetup) {
                User.findOneAndUpdate(
                  { email: user.email },
                  { $set: { codetime_exp: true } },
                  { new: true },
                  (data) => {
                    next()
                  }
                )
              }
              // console.log('timer triggered')
            }),

          600000
        )
        return () => clearTimeout(timers)
      }
    }
  )
  // console.log('email something')
  const data = await ejs.renderFile('./views/confirm.ejs', {
    username: user.name,
    userid: user._id,
    code: emailCode,
  })

  // console.log(user)
  const emailData = {
    from: process.env.Nodemailer_email,
    to: user.email,
    subject: 'Password reset code',
    html: data,
    // <span style="color:red"> ${resetCode}</span>
  }
  // send email
  // console.log('env ', process.env.Nodemailer_email)
  transporter.sendMail(emailData, (err, data) => {
    // console.log(err, data)
    if (err) {
      res.json({
        errors: false,
        err,
      })
    } else {
      // console.log(data)
      next()
    }
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
  getOperators,
  isAuth,
  isAdmin,
  verifyEmail,
  verifyEmailCode,
  logout,
  updateUser,
  removeUser,
  removeUserfromOrganisation,
  removeSeletedops,
  removeBulkUserfromOrganisation,
  createOperator,
  getProfile,
  confirmEmailCode,
  setUpOpAccount,
  checkOldpassword,
  setUpOpEmail,
}
