const Router = require('express')
const router = new Router()
const kpController = require('../controllers/kpController')

router.post('/', kpController.create)
router.get('/lastKpNumber', kpController.getLastKpNumber)
router.get('/:id', kpController.getOne)
router.delete('/:id', kpController.delete);

module.exports = router