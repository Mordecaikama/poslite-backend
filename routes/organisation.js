const express = require('express')
const router = express.Router()
const { upload } = require('../middleware/multermiddleware')

const {
  userById,
  requireSignIn,
  isAuth,
  isAdmin,
} = require('../controllers/user')

const {
  updateLogo,
  organiById,
  getOrganisation,
} = require('../controllers/organisation')

router.post(
  '/updatelogo/:userId/:organiId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  updateLogo
)

router.get(
  '/organisation/:userId/:organiId',
  requireSignIn,
  isAuth,
  getOrganisation
)

router.param('userId', userById) // save user information in all request made using userid
router.param('organiId', organiById)
module.exports = router
