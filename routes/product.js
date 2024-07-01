const express = require('express')
const router = express.Router()

const {
  userById,
  requireSignIn,
  isAuth,
  isAdmin,
} = require('../controllers/user')

const { upload, memupload } = require('../middleware/multermiddleware')

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
const { addImage, removeProdImage } = require('../middleware/s3middleware')

router.get('/product/:productId/:userId', requireSignIn, isAuth, getProduct)

router.post(
  '/product/:organiId/:userId',
  memupload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  addImage,
  // upload.array('photo', 8),
  Create
)

router.put(
  '/product/:productId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  memupload.single('photo'),
  removeProdImage,
  addImage,
  // upload.array('photo', 8),
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
  memupload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  removeProductfromOrganisation,
  removeProdImage, // checks if file exist in aws n deletes it
  remove
)

router.get('/products/:organiId', Products)

router.param('userId', userById)
router.param('productId', productById)
router.param('organiId', organiById)

module.exports = router
