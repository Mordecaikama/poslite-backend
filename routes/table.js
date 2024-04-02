const express = require('express')
const router = express.Router()

const { organiById } = require('../controllers/organisation')

const {
  userById,
  requireSignIn,
  isAuth,
  isAdmin,
} = require('../controllers/user')

const { addTableToorganisation } = require('../controllers/organisation')

const {
  tableId,
  create,
  listTables,
  getStatusValues,
  updateTable,
  remove,
  removeTablefromOrganisation,
  checkStatus,
  tableOverview,
} = require('../controllers/table')

const { checkUser, requireAuth } = require('../middleware/authmiddleware')

router.post(
  '/table/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  create,
  addTableToorganisation
)

router.get('/tables/:organiId/:userId', requireSignIn, isAuth, listTables)
router.get(
  '/tables/status/:organiId/:userId',
  requireAuth,
  checkUser,
  isAdmin,
  checkStatus
)

router.get('/table/status-values', getStatusValues)

router.put(
  '/table/:tableId/:userId',
  requireSignIn,
  isAuth,

  updateTable
)

router.delete(
  '/table/:tableId/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeTablefromOrganisation,
  remove
)

router.get(
  '/table-overview/:organiId/:userId',
  requireSignIn,
  isAuth,
  tableOverview
)

router.param('userId', userById)
router.param('tableId', tableId)
router.param('organiId', organiById)

module.exports = router
