const mongoose = require('mongoose')

const Schema = mongoose.Schema

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter category name'],
      // unique: true,
      maxlength: 32,
      uppercase: true,
    },
    img: {
      type: String,
      default: 'default.png',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', CategorySchema)
