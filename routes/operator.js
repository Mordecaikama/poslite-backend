const express = require('express')
const { upload } = require('../middleware/multermiddleware')

const {
  getOperator,
  getOperators,
  operatorById,
  removeOperatorfromOrganisation,
  updateOperator,
  removeOperator,
  removeBulkopsfromOrganisation,
  removeSeletedops,
} = require('../controllers/operator')
const { organiById } = require('../controllers/organisation')

const { createOperator } = require('../controllers/user')

const {
  requireSignIn,
  isAuth,
  isAdmin,
  userById,
} = require('../controllers/user')
const router = express.Router()

router.post('/operator/login/:operatorId/:organiId', getOperator)
router.get(
  // only admin can access
  '/operator/:organiId',
  getOperators
)

router.post(
  // only admin can access
  '/operator/:organiId/:userId',
  upload.single('photo'),
  requireSignIn,
  isAuth,
  isAdmin,
  createOperator
)
router.put(
  '/operator/:operatorId/:organiId',
  upload.single('photo'),
  updateOperator
)

// deletes bulk
router.delete(
  // only admin can access
  '/operator/bulk/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeBulkopsfromOrganisation,
  removeSeletedops
)

router.delete(
  // only admin can access
  // userid for auth, operatorid for particular operator, organiid for particular organisation
  '/operator/:operatorId/:userId/:organiId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeOperatorfromOrganisation,
  removeOperator
)

router.param('operatorId', operatorById)
router.param('organiId', organiById)
router.param('userId', userById)

module.exports = router
