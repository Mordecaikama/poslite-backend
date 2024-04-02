const mongoose = require('mongoose')

const Schema = mongoose.Schema

const tableSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter table name'],
      unique: true,
      maxlength: 32,
      uppercase: true,
    },
    status: {
      type: String,
      default: 'free',
      enum: ['free', 'reserved', 'checkedIn'],
    },
    time: {
      type: String,
      default: '-',
    },
    customer: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

const Table = mongoose.model('Table', tableSchema)

module.exports = Table
