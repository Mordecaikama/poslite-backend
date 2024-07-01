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
  Category.findById(id)
    .select('-createdAt -updatedAt')
    .exec((err, category) => {
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
  // var pimg
  // if (!req.file) {
  //   pimg = 'category.png'
  // } else {
  //   pimg = req.file.filename
  // }
  req.body.img = req.orgimage

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
  // var pimg
  // if (req.file) {
  //   pimg = req.file.filename
  //   req.body.img = pimg
  // }
  req.body.img = req.orgimage

  Category.findOneAndUpdate(
    { _id: req.category._id },
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

exports.Cat = (req, res) => {
  // console.log('something is cooking here ', req.organisation)
  Organisation.findById({ _id: req.organisation._id })
    .populate('category') // pull list of categories from organisation

    .populate({
      path: 'category',
      select: 'name img ',
      // match: { category: req.category._id },
    }) // pull list of categories from organisation
    .select('category')
    .exec((err, categories) => {
      if (err || !categories) {
        return res.status(400).json({
          error: 'No categories found',
        })
      }
      res.json({ data: categories })
    })
}

exports.Categories = (req, res) => {
  const limit = parseInt(req.query.limit)
  const skip = parseInt(req.query.skip) * limit
  // gets organisation data and populate operators then pushes to operatos tab

  var pipeline = [
    { $match: { _id: req.organisation._id } },
    { $project: { category: 1 } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categories',
      },
    },
    { $unwind: { path: '$categories' } },
    { $replaceRoot: { newRoot: '$categories' } },
    {
      $facet: {
        totalData: [
          { $match: {} },
          { $project: { name: 1, img: 1 } },
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
      return res.status(400).json({
        error: 'No Categories found',
      })
    }

    res.json({ data: doc })
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
