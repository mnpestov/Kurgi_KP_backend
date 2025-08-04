const { Kp, Manager, List, Row } = require('../models/models')
const ApiError = require('../errors/ApiError')
const { log } = require('console')

class ListController {
    async create(req, res, next) {
        try {
            let {
                startEvent,
                endEvent,
                startTimeStartEvent,
                endTimeStartEvent,
                startTimeEndEvent,
                endTimeEndEvent,
                eventPlace,
                countOfPerson,
                listTitle,
                kpId
            } = req.body
            const list = await List.create({
                startEvent,
                endEvent,
                startTimeStartEvent,
                endTimeStartEvent,
                startTimeEndEvent,
                endTimeEndEvent,
                eventPlace,
                countOfPerson,
                listTitle,
                kpId
            })

            return res.json(list)
        } catch (err) {
            next(ApiError.badRequest(err.message))
        }
    }


    async delete(req, res, next) {
        try {
            const { id } = req.params;

            // Сначала удалим все строки, связанные с этим списком
            await Row.destroy({ where: { listId: id } });

            // Затем сам список
            const deleted = await List.destroy({ where: { id } });

            if (!deleted) {
                return next(ApiError.badRequest('Список с таким ID не найден'));
            }

            return res.json({ message: 'Список и связанные строки удалены' });
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }

}


module.exports = new ListController()