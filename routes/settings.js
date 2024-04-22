const express = require('express')
const router = express.Router()

const { readfile, writefile } = require('../controllers/settings')

router.get('/file', readfile)
router.post('/file/write', writefile)

module.exports = router
