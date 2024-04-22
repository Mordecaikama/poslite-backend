const Category = require('../models/category')
const Organisation = require('../models/organisation')

const handleErrors = (err) => {
  let error = {
    name: '',
    code: '',
  }

  if (err.code === 11000) {
    error.name = 'Category name already exist'
    return error
  }

  return error
}

// middleware
exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, category) => {
    if (err) {
      res.status(400).json({
        error: 'category does not exist',
      })
    }
    req.category = category
    next()
  })
}

// all category
exports.read = (req, res) => {
  return res.json(req.category)
}

// create category
exports.Create = (req, res) => {
  // console.log(req.body)
  const category = new Category(req.body)

  category
    .save()
    .then((doc) => {
      Organisation.findOneAndUpdate(
        { _id: req.organisation._id },
        { $push: { category: doc } },
        { new: true }
      ).exec((error, data) => {
        if (error) {
          return res.status(400).json({
            error: 'Could not save Category to Organisation',
          })
        }
        res.json({ data: 'successful' })
      })
    })
    .catch((err) => {
      let errors = handleErrors(err)
      res.json({ errors })
    })
}

exports.update = (req, res) => {
  // console.log(req.body)
  Category.findOneAndUpdate(
    { _id: req.body.id },
    { $set: req.body },
    { new: true },
    (err, doc) => {
      if (err) {
        // console.log(err)
        return res.status(400).json({
          error: 'category could not be updated',
        })
      }
      res.json({ data: 'successful' })
    }
  )
}

exports.remove = (req, res) => {
  const category = req.category
  category.remove((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Category could not be deleted',
      })
    }
    if (data) {
      res.json({
        data: 'category removed successfully',
      })
    }
  })
}

exports.removeCategoryfromOrganisation = (req, res, next) => {
  const category = req.category
  const organi = req.organisation
  const opid = category._id.toString()
  const oid = organi._id.toString()
  // console.log(organi, category, oid)
  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { category: opid } }
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

exports.Categories = (req, res) => {
  console.log('something is cooking here ', req.organisation)
  Organisation.findById({ _id: req.organisation._id })
    .populate('category') // pull list of categories from organisation
    .select('category _id')
    .exec((err, categories) => {
      if (err || !categories) {
        return res.status(400).json({
          error: 'No categories found',
        })
      }
      res.json({ data: categories })
    })
}

exports.getCategoryproducts = (req, res) => {
  Organisation.findById({ _id: req.organisation._id })
    .populate({
      path: 'products',
      select: 'name price image description',
      match: { category: req.category._id },
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

exports.removeSeletedcategory = (req, res) => {
  // console.log(req.body, 'main')
  Category.deleteMany({ _id: { $in: req.body } }, (err, data) => {
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
exports.removeBulkcategoryfromOrganisation = (req, res, next) => {
  const oid = req.organisation._id.toString()
  // console.log(req.body, 'something here')
  // res.json({ error: 'error' })

  Organisation.findOneAndUpdate(
    { _id: oid },
    // { $in: { candidates: candidate._id } },
    { $pull: { category: { $in: req.body } } }
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
