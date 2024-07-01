const multer = require('multer')

const storage = multer.diskStorage({
  // this defines the folder to store the files
  destination: (req, file, cb) => {
    cb(null, './uploads/images')
  },
  filename: (req, file, cb) => {
    // defines how file with extensions will be stored and retrieved
    cb(null, Date.now() + file.originalname)
  },
})

// for storing memory or binary
const memstorage = multer.memoryStorage()

exports.upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
})

// this middleware is for storing in memory
exports.memupload = multer({
  storage: memstorage,
})
