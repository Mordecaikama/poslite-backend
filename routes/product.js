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
  Products,
  Create,
  productById,
  getProduct,
  update,
  remove,
  removeProductfromOrganisation,
  removeSeletedproducts,
  removeBulkproductsfromOrganisation,
} = require('../controllers/product')

const { organiById } = require('../controllers/organisation')

router.get('/product/:productId/:userId', requireSignIn, isAuth, getProduct)

router.post(
  '/product/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  upload.array('photo', 8),
  Create
)

router.put(
  '/product/:productId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  upload.array('photo', 8),
  update
)

// deletes bulk
router.delete(
  '/products/bulk/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeBulkproductsfromOrganisation,
  removeSeletedproducts
)

router.delete(
  '/product/:productId/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeProductfromOrganisation,
  remove
)

router.get('/products/:organiId', Products)

router.param('userId', userById)
router.param('productId', productById)
router.param('organiId', organiById)

module.exports = router
