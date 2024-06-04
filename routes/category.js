const express = require('express')
const router = express.Router()

const {
  userById,
  requireSignIn,
  isAuth,
  isAdmin,
} = require('../controllers/user')

const { upload } = require('../middleware/multermiddleware')

const {
  Categories,
  Cat,
  Create,
  categoryById,
  read,
  update,
  remove,
  removeCategoryfromOrganisation,
  getCategoryproducts,
  removeBulkcategoryfromOrganisation,
  removeSeletedcategory,
} = require('../controllers/category')

const { organiById } = require('../controllers/organisation')

router.get('/category/:categoryId/:userId', requireSignIn, isAuth, read)

router.get(
  '/category/:organiId/:categoryId/:userId',
  requireSignIn,
  isAuth,
  getCategoryproducts
)
router.get('/categories/:organiId/:userId', requireSignIn, isAuth, Categories)

router.get('/categorys/:organiId/:userId', requireSignIn, isAuth, Cat)

router.post(
  // only admin can access
  '/category/:organiId/:userId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  Create
)

router.put(
  // only admin can access
  '/category/:categoryId/:userId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  update
)

// deletes bulk
router.delete(
  // only admin can access
  '/category/bulk/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeBulkcategoryfromOrganisation,
  removeSeletedcategory
)

router.delete(
  // only admin can access
  '/category/:categoryId/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeCategoryfromOrganisation,
  remove
)

router.param('userId', userById)
router.param('categoryId', categoryById)
router.param('organiId', organiById)

module.exports = router
