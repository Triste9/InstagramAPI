'use strict'
import { send, json } from 'micro'
import HttpHash from 'http-hash'
import Db from 'backenplatzi'
import DbStrub from './test/stub/db'
import config from './config'
const env = 'test'
let db = new Db(config.db)
if (env === 'test') {
  db = new DbStrub()
}
const hash = HttpHash()

hash.set('GET /tag/:tag', async function byTag (req, res, params) {
  let tag = params.tag
  await db.connect()
  let images = await db.getImageByTag(tag)
  await db.disconnect()
  send(res, 200, images)
})
hash.set('GET /list', async function list (req, res, params) {
  await db.connect()
  let images = await db.getImages()
  await db.disconnect()
  send(res, 200, images)
})
hash.set('GET /:id', async function getPicture (req, res, params) {
  let id = params.id
  await db.connect()
  let image = await db.getImage(id)
  await db.disconnect()
  send(res, 200, image)
})

hash.set('POST /', async function postPicture (req, res, params) {
  let image = await json(req)
  await db.connect()
  let created = await db.saveImage(image)
  await db.disconnect()
  send(res, 201, created)
})
hash.set('POST /:id/like', async function likePicture (req, res, params) {
  let id = params.id
  await db.connect()
  let image = await db.likeImage(id)
  await db.disconnect()
  send(res, 200, image)
})
export default async function main (req, res) {
  let { method, url } = req
  let match = hash.get(`${method.toUpperCase()} ${url}`)
  if (match.handler) {
    try {
      await match.handler(req, res, match.params)
    } catch (e) {
      send(res, 500, { error: e.message })
    }
  } else {
    send(res, 404, { error: 'route not found' })
  }
}