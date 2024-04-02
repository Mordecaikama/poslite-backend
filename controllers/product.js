const Product = require('../models/product')
const Organisation = require('../models/organisation')

const handleErrors = (err) => {
  let error = {
    name: '',
    code: '',
    category: '',
  }

  if (err.code === 11000) {
    error.name = 'Product already exists'
    return error
  }

  if (err.name === 11000) {
    error.name = 'this menu already exist'
    return error
  }

  if (err.message.includes('Product validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      error[properties.path] = properties.message
    })
  }

  return error
}

exports.productById = (req, res, next, id) => {
  // console.log('from productid', id, 'operatorById')
  Product.findById(id).exec((err, product) => {
    if (err || !product) {
      // console.log(err)
      return res.status(400).json({ error: 'product not found' })
    }
    // console.log(operator)
    req.product = product
    next()
  })
}

exports.getProduct = (req, res) => {
  return res.json(req.product)
}

exports.Create = (req, res) => {
  // console.log(req.body)
  var pimg
  var imgs = []
  if (!req.files.length) {
    pimg = ['default.png']
  } else {
    for (let f of req.files) {
      imgs.push(f.filename)
    }
    pimg = imgs
  }
  req.body.img = pimg

  // console.log(req.body)
  // res.json({ data: 'sent successfully' })
  const product = new Product(req.body)

  product
    .save()
    .then((doc) => {
      Organisation.findOneAndUpdate(
        { _id: req.organisation._id },
        { $push: { products: doc } },
        { new: true }
      ).exec((error, data) => {
        // console.log(data)
        if (error) {
          return res.status(400).json({
            error: 'Could not save product to Organisation',
          })
        }
        res.json({ data: 'successful' })
      })
    })
    .catch((err) => {
      // console.log(err)
      let errors = handleErrors(err)
      // console.log(errors)
      res.json({ errors })
    })
}

exports.update = (req, res) => {
  // const { _id, ...rest } = req.product
  var pimg
  var imgs = []
  if (!req.files.length) {
    pimg = ['default.png']
  } else {
    for (let f of req.files) {
      imgs.push(f.filename)
    }
    pimg = imgs
  }
  req.body.img = pimg

  // res.json({ data: 'successful' })
  Product.findOneAndUpdate(
    { _id: req.body.id },
    { $set: req.body },
    { new: true },
    (err, doc) => {
      if (err) {
        return res.status(400).json({
          error: 'category could not be updated',
        })
      }
      res.json({ data: 'successful' })
    }
  )
}

exports.remove = (req, res) => {
  const product = req.product
  product.remove((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'product could not be deleted',
      })
    }
    if (data) {
      res.json({
        data: 'product removed successfully',
      })
    }
  })
}

exports.removeProductfromOrganisation = (req, res, next) => {
  const product = req.product
  const organi = req.organisation
  const opid = product._id.toString()
  const oid = organi._id.toString()
  // console.log(organi, category, oid)
  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { products: opid } }
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

exports.Products = (req, res) => {
  Organisation.findById({ _id: req.organisation._id })
    .populate({
      path: 'products',
      select: 'name price category description img',
    }) // pull list of categories from organisation
    .select('products')
    .exec((err, menu) => {
      if (err || !menu) {
        console.log(err)
        return res.status(400).json({
          error: 'No categories product found',
        })
      }

      // console.log(menu)
      res.json({ data: menu })
    })
}

//  deletes selected array of voters from voters document
exports.removeSeletedproducts = (req, res) => {
  // console.log(req.body, 'something here')
  Product.deleteMany({ _id: { $in: req.body } }, (err, data) => {
    if (err || !data) {
      // console.log(err)
      return res.status(400).json({
        error: 'No products found',
      })
    }
    res.json({ data: 'successful' })
  })
}
//launch election

// middleware to delete selected array of voters from election
exports.removeBulkproductsfromOrganisation = (req, res, next) => {
  const oid = req.organisation._id.toString()

  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { products: { $in: req.body } } }
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
