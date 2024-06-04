const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const organisationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter Organisation name'],
      maxlength: 32,
    },
    operators: [{ type: ObjectId, ref: 'Operator' }],
    products: [{ type: ObjectId, ref: 'Product' }],
    category: [{ type: ObjectId, ref: 'Category' }],
    orders: [{ type: ObjectId, ref: 'Order' }],
    tables: [{ type: ObjectId, ref: 'Table' }],
    users: [{ type: ObjectId, ref: 'User' }],
    state: {
      type: String,
    },
    subdomain: {
      type: String,
      maxlength: 32,
    },
    subdomain_url: {
      type: String,
    },

    logo: {
      type: String,
      default: 'default.png',
    },
    pricing: {},
    config: {},
  },

  { timestamps: true }
)

const Organisation = mongoose.model('Organisation', organisationSchema)

module.exports = Organisation
