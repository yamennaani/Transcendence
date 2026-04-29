const Minio = require('minio')

const client = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT || 'minio',
  port:      parseInt(process.env.MINIO_PORT) || 9000,
  useSSL:    false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const BUCKET = process.env.MINIO_BUCKET || 'submissions'

const uploadToMinio = async (fileName, buffer, mimetype, size) => {
  await client.putObject(BUCKET, fileName, buffer, size, {
    'Content-Type': mimetype
  })
}

const getSignedUrl = async (fileName, originalName) => {
  const url = await client.presignedGetObject(BUCKET, fileName, 10 * 60, {
    'response-content-disposition': `attachment; filename="${originalName}"`
  })
  return url.replace(
    `http://minio:9000`,
    `http://localhost/files`
  )
}

const deleteFromMinio = async (fileName) => {
  await client.removeObject(BUCKET, fileName)
}

module.exports = { uploadToMinio, getSignedUrl, deleteFromMinio }