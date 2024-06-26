const express = require('express')
const Organisation = require('../models/organisation')
const User = require('../models/user')
require('dotenv').config()

exports.organiById = (req, res, next, id) => {
  Organisation.findById(id).exec((err, data) => {
    if (err || !data) {
      return res.status(400).json({
        error: 'No Organisation found',
      })
    }
    req.organisation = data
    next()
  })
}

//adds user
exports.addToOrganisation = (req, res) => {
  // changes permision to admin
  req.body.user = req.profile
  req.body.name = req.profile.name
  req.body.config = req.appconfig
  // console.log('request ', req.body)
  const org = new Organisation(req.body)

  org.users.push(req.body.user._id) // adds user to users field before saving

  org
    .save()
    .then((org) => {
      // console.log('successfully saved to db')
      // console.log('organisation ', org)
      const { email, _id, ...rest } = org.user
      // console.log('organisation created', org)
      res.send({ data: { user: { email, _id } } })
    })
    .catch((err) => {
      res.send({ data: err })
    })
}

exports.addUserToOrganisation = (req, res) => {
  // adds user to users array in organisation
  var operator = req.user
  Organisation.findOneAndUpdate(
    { _id: req.organisation._id },
    { $push: { users: operator } },
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

exports.getOrganisation = (req, res) => {
  var id = req.organisation._id.toString()
  // console.log(req.profile, id)
  Organisation.findById(id)
    .select('name logo user config')
    .exec((err, doc) => {
      if (err || !doc) {
        res.status(400).json({ errors: 'No User found' })
      }
      // console.log(doc)

      res.status(200).send({ data: doc })
    })
}

exports.updateCompany = (req, res) => {
  // console.log(req)
  // var pimg
  // if (!req.file) {
  //   pimg = 'default.png'
  // } else {
  //   pimg = req.file.filename
  // }

  if (req.file) {
    // pimg = req.file.filename
    // req.body.logo = pimg
    req.body.logo = req.orgimage
  }

  // req.body.logo = pimg

  Organisation.findOneAndUpdate(
    { _id: req.organisation._id },
    {
      $set: req.body,
    },
    { new: true }
  )
    .select('name logo')
    .exec((err, doc) => {
      if (err) {
        res.status(400).json({ error: err })
      }
      res.json({ data: doc })
    })
}

exports.updateSettings = (req, res) => {
  // console.log(req.body)
  Organisation.findOneAndUpdate(
    { _id: req.organisation._id },
    {
      $set: req.body,
    },

    { new: true }
  )
    .select('config')
    .exec((err, doc) => {
      if (err) {
        res.status(400).json({ error: err })
      }
      res.json({ data: doc })
    })
}

//adds order
exports.addOrderToOrderHistory = (req, res) => {
  // this is a middleware which saves user product order details into the user history before order is sent to be saved in the order table

  // console.log(req.body)
  // res.json({ data: true })
  Organisation.findOneAndUpdate(
    { _id: req.organisation._id },
    { $push: { orders: req.order } },
    { new: true },
    (error, data) => {
      if (error) {
        return res.status(400).json({
          error: 'Could not update user purchase history',
        })
      }

      res.json({ data: true })
    }
  )
}

// adds table
exports.addTableToorganisation = (req, res) => {
  // this is a middleware which saves user product order details into the user history before order is sent to be saved in the order table

  // console.log('organisation')
  // res.json({ data: true })
  Organisation.findOneAndUpdate(
    { _id: req.organisation._id },
    { $push: { tables: req.table } },
    { new: true },
    (error, data) => {
      if (error) {
        return res.status(400).json({
          error: 'Could not add TAble to your company',
        })
      }
      res.json({ data: true })
    }
  )
}
