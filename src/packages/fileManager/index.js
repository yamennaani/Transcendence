const Minio = require('minio')
const multer = require('multer')

// ── Uploader (shared multer config) ──────────────────
const ALLOWED_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype))
      cb(null, true)
    else
      cb(new Error(`File type not allowed: ${file.mimetype}`))
  }
})

// ── Storage (per bucket) ─────────────────────────────
const client = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT || 'minio',
  port:      parseInt(process.env.MINIO_PORT) || 9000,
  useSSL:    false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const createStorage = (bucket) => {
  return {
    upload: (fileName, buffer, mimetype, size) =>
      client.putObject(bucket, fileName, buffer, size, { 'Content-Type': mimetype }),

    getUrl: async (fileName, originalName, expirySeconds = 600) => {
      const url = await client.presignedGetObject(bucket, fileName, expirySeconds, {
        'response-content-disposition': `attachment; filename="${originalName}"`
      })
      return url.replace('http://minio:9000', 'http://localhost/files')
    },

    delete: (fileName) =>
      client.removeObject(bucket, fileName),

    ensureBucket: async () => {
      const exists = await client.bucketExists(bucket)
      if (!exists) await client.makeBucket(bucket)
    },

    makePublic: async () => {
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`]
        }]
      })
      await client.setBucketPolicy(bucket, policy)
    },

    getPublicUrl: (fileName) =>
      `http://localhost/files/${bucket}/${fileName}`
  }
}

module.exports = { uploader, createStorage }