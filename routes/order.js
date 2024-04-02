const express = require('express')
const router = express.Router()

const {
  userById,
  requireSignIn,
  isAuth,
  isAdmin,
} = require('../controllers/user')

const {
  addOrderToOrderHistory,
  organiById,
} = require('../controllers/organisation')
const { operatorById } = require('../controllers/operator')
const { checkUser, requireAuth } = require('../middleware/authmiddleware')

const {
  orderById,
  create,
  listOrders,
  remove,
  operatorOrders,
  getStatusValues,
  updateOrderStatus,
  updateTableOrder,
} = require('../controllers/order')

router.post(
  '/order/:organiId/:userId',
  requireSignIn,
  isAuth,
  create,
  updateTableOrder,
  addOrderToOrderHistory // updates table history //adds to organisationn history
)

router.post('/orders/:organiId/:userId', requireSignIn, isAuth, listOrders)

router.get('/order/status-values', getStatusValues)

router.put(
  '/order/:orderId/:userId',
  requireSignIn,
  isAuth,
  updateTableOrder,
  updateOrderStatus
)

router.param('userId', userById)
router.param('opId', operatorById)
router.param('orderId', orderById)
router.param('organiId', organiById)

module.exports = router
