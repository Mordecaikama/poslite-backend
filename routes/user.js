const express = require('express')
const router = express.Router()

const { upload } = require('../middleware/multermiddleware')
const {
  readPricingfilemiddleware,
  readConfigfilemiddleware,
} = require('../controllers/settings')
const {
  userById,
  create_User,
  createOperator,
  verifyEmail,
  get_User,
  getUsers, // for non admin users e.g operators
  getOperators, // admin getting all operators with skip and limit
  isAuth,
  isAdmin,
  requireSignIn,
  logout,
  updateUser,
  removeUser,
  removeUserfromOrganisation,
  removeSeletedops,
  removeBulkUserfromOrganisation,
  getProfile,
  confirmEmailCode,
  verifyEmailCode,
  setUpOpAccount,
  checkOldpassword,
  setUpOpEmail,
} = require('../controllers/user')

const {
  addToOrganisation,
  addUserToOrganisation,
  organiById,
} = require('../controllers/organisation')

router.post('/signin', get_User)
router.post(
  '/signup',
  upload.single('photo'),
  create_User,
  readConfigfilemiddleware,
  confirmEmailCode,
  addToOrganisation
)

router.post('/verify-email', verifyEmail)

router.post('/confirmooperator/:organiId/:userId', setUpOpAccount, updateUser)

router.post('/confirm-code', verifyEmailCode)

router.post(
  // only admin can access
  '/operator/:organiId/:userId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  createOperator, // creates a new user
  setUpOpEmail, // setsup user email for account setup
  addUserToOrganisation // adds new user to the organisation
)

router.get('/profile/:userId', requireSignIn, isAuth, getProfile)

// only admin can access
router.get('/user/:organiId/:userId', requireSignIn, isAuth, isAdmin, getUsers)

// for admin skip and limit
router.get(
  '/users/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  getOperators
)

router.post('/update/password/:userId', requireSignIn, isAuth, checkOldpassword)

router.put('/user/:userId/:organiId', upload.single('photo'), updateUser)

// deletes bulk
router.delete(
  // only admin can access
  '/user/bulk/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeBulkUserfromOrganisation,
  removeSeletedops
)

router.delete(
  // only admin can access
  // userid for auth, operatorid for particular operator, organiid for particular organisation
  '/user/:userId/:organiId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeUserfromOrganisation,
  removeUser
)

router.get('/logout/:userId', requireSignIn, isAuth, logout)

// save user information in all request made using userid
router.param('userId', userById)

router.param('organiId', organiById)

module.exports = router

module.exports = router
