const Router = require('express')
const router = new Router()

const kp = require('./kp')
const list = require('./list')
const row = require('./row')

router.use('/kp',kp)
router.use('/list', list)
router.use('/row', row)

module.exports = router