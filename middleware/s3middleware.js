const { nanoid } = require('nanoid')

const {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3')

require('dotenv').config()

let s3 = new S3Client({
  region: 'us-east-1',
  signatureVersion: 'v4',
  credentials: {
    accessKeyId: process.env.aws_access_key,
    secretAccessKey: process.env.aws_secret_key,
  },
})

exports.addImage = async (req, res, next) => {
  try {
    // console.log('someting ', req.file)
    // destructure
    // const { image } = req.body

    // checks if image exists
    // if (!req.file) return res.status(400).send('no image')

    // extract image
    // const base64 = new Buffer.from(image.replace(/^data:image\/\w:base64,/, ''))

    // const base64 = new Buffer.from(
    //   req.body.image.replace(/^data:image\/\w+;base64,/, ''),
    //   'base64'
    // )

    if (!req.file) {
      next()
    }
    const base64 = req.file.buffer

    const filetype = req.file.mimetype.split('/')[1]
    // const type = image.split(';')[0].split('/')[1]
    const filen = `${nanoid()}.${filetype}`

    const uploadParams = new PutObjectCommand({
      Bucket: process.env.aws_s3_bucket_name,
      Key: filen, //default to jpeg
      Body: base64,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: `image/jpg`,
    })

    const response = await s3.send(uploadParams, (err, data) => {
      if (err) {
        res.sendStatus(400)
      }
      req.orgimage = filen
      console.log('new file saved to aws')
      next()
    })

    // res.json({ data: 'success' })
  } catch (error) {
    console.log('error ', error)
  }
}

//removes category image before saving a new one
exports.removeCatImage = async (req, res, next) => {
  if (req.category) {
    const filen = req.category.img
    if (!req.file || filen === 'default.png') {
      next()
    } else {
      const deleteParams = new DeleteObjectCommand({
        Bucket: process.env.aws_s3_bucket_name,
        Key: filen, //default to jpeg
      })

      const response = await s3.send(deleteParams, (err, data) => {
        if (err) {
          res.sendStatus(400)
        }
        next()
      })
    }
  }
}

//removes user image before saving a new one
exports.removeUserImage = async (req, res, next) => {
  if (req.profile) {
    const filen = req.profile.img
    if (!req.file || filen === 'default.png') {
      next()
    } else {
      const deleteParams = new DeleteObjectCommand({
        Bucket: process.env.aws_s3_bucket_name,
        Key: filen, //default to jpeg
      })

      const response = await s3.send(deleteParams, (err, data) => {
        if (err) {
          res.sendStatus(400)
        }

        next()
      })
    }
  }
}
//removes user image before saving a new one
exports.removeOrgImage = async (req, res, next) => {
  if (req.organisation) {
    const filen = req.organisation.logo
    if (!req.file || filen === 'default.png') {
      console.log('no img file')
      next()
    } else {
      const deleteParams = new DeleteObjectCommand({
        Bucket: process.env.aws_s3_bucket_name,
        Key: filen, //default to jpeg
      })

      const response = await s3.send(deleteParams, (err, data) => {
        if (err) {
          res.sendStatus(400)
        }
        console.log('successfully deleted')
        next()
      })
    }
  }
}
//removes user image before saving a new one
exports.removeProdImage = async (req, res, next) => {
  if (req.product) {
    const filen = req.product.img[0]
    if (!req.file || filen === 'default.png') {
      // console.log('no img file')
      next()
    } else {
      // console.log('file being deleted')
      const deleteParams = new DeleteObjectCommand({
        Bucket: process.env.aws_s3_bucket_name,
        Key: filen, //default to jpeg
      })

      const response = await s3.send(deleteParams, (err, data) => {
        if (err) {
          res.sendStatus(400)
        }
        // console.log('successfully deleted')
        next()
      })
    }
  }
}

// exports.deleteUserImage = async (req, res, next) => {
//   if (req.profile.img !== 'default.png') {
//     const filen = req.profile.img
//     if (filen !== 'default.png') {
//       const deleteParams = new DeleteObjectCommand({
//         Bucket: process.env.aws_s3_bucket_name,
//         Key: filen, //default to jpeg
//       })

//       const response = await s3.send(deleteParams, (err, data) => {
//         if (err) {
//           res.sendStatus(400)
//         }
//         next()
//       })
//     }
//   } else {
//     next()
//   }
// }

exports.removeImage = async (req, res, next) => {
  try {
    const filen = req.candidate.image

    if (filen !== 'default.png') {
      const deleteParams = new DeleteObjectCommand({
        Bucket: process.env.aws_s3_bucket_name,
        Key: filen, //default to jpeg
      })

      const response = await s3.send(deleteParams, (err, data) => {
        if (err) {
          res.sendStatus(400)
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}
