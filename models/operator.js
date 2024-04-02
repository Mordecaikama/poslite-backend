const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { isEmail } = require('validator')

const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const operatorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your username'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter a valid email'],
    },
    pin: {
      type: String,
      required: [true, 'Please enter your Pin'],
      maxlength: [4, 'Minimum password Length is 4'],
    },
    img: {
      type: String,
      default: '',
    },
    code: '',
    codetime_exp: {
      type: Boolean,
      default: false,
    },
    acc_setup: {
      type: Boolean,
      default: false,
    },
    acc_verify_at: {
      type: String,
    },
    can_use_coupon: {
      type: Boolean,
    },
  },
  { timestamps: true }
)

operatorSchema.pre('save', async function (next) {
  // before saving it hashes password field
  const salt = await bcrypt.genSalt()
  this.pin = await bcrypt.hash(this.pin, salt)

  next()
})

operatorSchema.statics.login = async function (id, pin) {
  const operator = await this.findOne({ _id: id })
  // return users

  // console.log(operator)

  if (operator) {
    const auth = await bcrypt.compare(pin, operator.pin)
    if (auth) {
      return operator
    }

    if (!auth) {
      throw Error('incorrect pin')
    }
    // if (!user.acc_setup) {
    //   throw Error('Account not Verified')
    // }
  }
  throw Error('incorrect id')
}

const Operator = mongoose.model('Operator', operatorSchema)

module.exports = Operator
