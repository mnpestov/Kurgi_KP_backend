const Router = require('express')
const router = new Router()
const kpController = require('../controllers/kpController')

router.post('/', kpController.create)
router.get('/lastKpNumber', kpController.getLastKpNumber)
router.get('/latest', kpController.getLastFive); 
router.get('/:id', kpController.getOne)
router.put('/:kpNumber', kpController.update);
router.delete('/:id', kpController.delete);

module.exports = router