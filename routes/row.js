const Router = require('express')
const router = new Router()
const rowController = require('../controllers/rowController')

router.post('/', rowController.create)
router.delete('/:id', rowController.delete)
router.put('/update', rowController.update)

module.exports = router