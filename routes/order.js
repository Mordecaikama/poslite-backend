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
  ordersOverview,
  OrdersGraph,
  removeBulkordersfromOrganisation,
  removeSeletedOrders,
  updateTableBefDel,
} = require('../controllers/order')

router.post(
  '/ordersoverview/:organiId/:userId',
  requireSignIn,
  isAuth,
  ordersOverview
)

router.post(
  '/order/:organiId/:userId',
  requireSignIn,
  isAuth,
  create,
  updateTableOrder,
  addOrderToOrderHistory // updates table history //adds to organisationn history
)

router.post('/orders/:organiId/:userId', requireSignIn, isAuth, listOrders)

router.post(
  '/orders-graph/:organiId/:userId',
  requireSignIn,
  isAuth,
  OrdersGraph
)

router.get('/order/status-values', getStatusValues)

router.put(
  '/order/:orderId/:userId',
  requireSignIn,
  isAuth,
  updateTableOrder,
  updateOrderStatus
)

// deletes bulk
router.delete(
  // only admin can access
  '/orders/bulk/:organiId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  removeBulkordersfromOrganisation,
  removeSeletedOrders
)

router.delete(
  '/order/:orderId/:userId',
  requireSignIn,
  isAuth,
  isAdmin,
  updateTableBefDel,
  remove
)

router.param('userId', userById)
router.param('opId', operatorById)
router.param('orderId', orderById)
router.param('organiId', organiById)

module.exports = router
