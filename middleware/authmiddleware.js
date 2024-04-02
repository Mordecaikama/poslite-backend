const jwt = require('jsonwebtoken')
const User = require('../models/User')
require('dotenv').config()

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt

  // console.log('requireauth')
  if (token) {
    jwt.verify(token, process.env.jt, (err, data) => {
      if (err) {
        // console.log(err.message)
        res.send({ auth: 'Access denied' })
      } else {
        next()
      }
    })
  } else {
    // console.log('usernot found')
    res.send({ auth: false })
  }
}

const checkUser = (req, res, next) => {
  // behind ther scenes it really checks operator
  const token = req.cookies.jwt
  // console.log('checking if user exist', token)
  // console.log(req.cookies, req.headers)
  // console.log('checkuser')
  if (token) {
    jwt.verify(token, process.env.jt, async (err, decodedToken) => {
      if (err) {
        // console.log(err.message)
        res.send({ auth: 'User Denied' })
        // res.locals.user = null
        next()
      } else {
        // console.log(decodedToken)
        // let user = await User.findById(decodedToken.id)
        // req.user = user
        next()
      }
    })
  } else {
    res.send({ user: false })
  }
}

module.exports = { requireAuth, checkUser }
