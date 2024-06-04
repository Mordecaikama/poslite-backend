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
  updateCompany,
  organiById,
  getOrganisation,
  updateSettings,
} = require('../controllers/organisation')

router.get(
  '/organisation/:userId/:organiId',
  requireSignIn,
  isAuth,
  getOrganisation
)

router.put(
  '/organisation/:userId/:organiId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  updateCompany
)

router.put(
  '/organisation/settings/:userId/:organiId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  updateSettings
)

router.param('userId', userById) // save user information in all request made using userid
router.param('organiId', organiById)
module.exports = router
