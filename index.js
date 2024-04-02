const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

require('dotenv').config()
const app = express()

// router imports

const routeUser = require('./routes/user')
const routeProduct = require('./routes/product')
const routeCategory = require('./routes/category')
const routesOrder = require('./routes/order')
const routesTable = require('./routes/table')
const routesOperator = require('./routes/operator')

// middleware
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.static('uploads'))

mongoose.set('strictQuery', false)
mongoose
  .connect(process.env.base_db || null) // db is online resource, referenced at the top
  .then((results) => {
    // const res = results.watch()
    console.log('connected to db successfully')
  })
  .catch((e) => {
    console.log(e)
  })

app.use('/api', routeUser)
app.use('/api', routeProduct)
app.use('/api', routeCategory)
app.use('/api', routesOperator)
app.use('/api', routesOrder)
app.use('/api', routesTable)

const port = process.env.PORT || 8000

// Global error handler that takes 4 arguments and ExpressJS knows that
app.use((err, req, res, next) => {
  console.log(err, 'error ocurring')

  res.status(err.status).json(err)
})

app.listen(port, () => console.log('Server running on port ', port))
