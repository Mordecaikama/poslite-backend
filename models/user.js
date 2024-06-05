const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { isEmail } = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema(
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
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minlength: [4, 'Minimum password Length is 4'],
    },
    permission: {
      type: String,
      default: 'operator',
      enum: ['operator', 'admin', 'user'],
    },
    img: {
      type: String,
      default: '',
    },
    cart: [],
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

userSchema.pre('save', async function (next) {
  // before saving it hashes password field

  const salt = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, salt)

  next()
})

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email })
  // return users
  if (user) {
    const auth = await bcrypt.compare(password, user.password)

    if (auth && user.acc_setup) {
      return user
    }

    if (!auth) {
      throw Error('incorrect password')
    }
    if (!user.acc_setup) {
      throw Error('Account not Verified')
    }
  }
  throw Error('incorrect email')
}

const User = mongoose.model('User', userSchema)

module.exports = User
