const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const OrderSchema = new mongoose.Schema(
  {
    products: [],
    transaction_id: {},
    amount: { type: Number },
    address: String,
    table: {
      type: String,
      required: [true, 'Please enter the table Name'],
    },
    status: {
      type: String,
      default: 'Not processed',
      enum: [
        'Not processed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
      ],
    },
    paytype: {
      type: String,
      default: 'cash',
      enum: ['cash', 'card'],
    },
    paid: { type: Number },
    tax: { type: Number },
    updated: Date,
    operator: { type: ObjectId, ref: 'User' },
    customer: { type: String, default: '' },
  },
  { timestamps: true }
)

const Order = mongoose.model('Order', OrderSchema)

module.exports = { Order }
