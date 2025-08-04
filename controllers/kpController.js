const { Kp, Manager, List, Row } = require('../models/models')
const ApiError = require('../errors/ApiError')
const { log } = require('console')

class KpController {
    async create(req, res, next) {
        try {
            let { kpNumber,
                kpDate,
                contractNumber,
                contractDate,
                startEvent,
                endEvent,
                eventPlace,
                countOfPerson,
                deliveryInMkad,
                logisticsCost,
                listTitle,
                isWithinMkad,
                managerName
            } = req.body

            const kp = await Kp.create({
                kpNumber,
                kpDate,
                contractNumber,
                contractDate,
                startEvent,
                endEvent,
                eventPlace,
                countOfPerson,
                deliveryInMkad,
                logisticsCost,
                listTitle,
                isWithinMkad,
                managerName
            })
            return res.json(kp)
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return next(ApiError.badRequest('КП с таким номером уже существует'));
            }
            next(ApiError.badRequest(err.message))
        }
    }

    async getOne(req, res, next) {
        const { id } = req.params;
        try {
            const kp = await Kp.findOne({
                where: { kpNumber: id },
                include: [
                    {
                        model: List,
                        attributes: ['id', 'startEvent', 'endEvent', 'startTimeStartEvent', 'endTimeStartEvent', 'startTimeEndEvent', 'endTimeEndEvent', 'eventPlace', 'countOfPerson', 'listTitle'],
                        include: [
                            {
                                model: Row,
                                attributes: ['id', 'countOfProduct', 'priceOfProduct', 'product', 'composition', 'productWeight', 'typeOfProduct']
                            }
                        ]
                    }
                ]
            });

            if (!kp) {
                return res.status(404).json({ message: "KP not found" });
            }

            const formattedResponse = {
                formData: {
                    id: kp.id,
                    managerName: kp.managerName,
                    managerJobTitle: kp.manager?.role || '',
                    managerEmail: kp.manager?.email || '',
                    managerTel: kp.manager?.tel || '',
                    managerPhoto: '', // Поле отсутствует в модели Manager
                    kpNumber: kp.kpNumber,
                    kpDate: kp.kpDate,
                    contractNumber: kp.contractNumber,
                    contractDate: kp.contractDate,
                    startEvent: kp.startEvent,
                    endEvent: kp.endEvent,
                    startTime: '', // Уточните источник данных для этого поля
                    endTime: '', // Уточните источник данных для этого поля
                    startTimeStartEvent: kp.lists?.[0]?.startTimeStartEvent || '',
                    endTimeStartEvent: kp.lists?.[0]?.endTimeStartEvent || '',
                    startTimeEndEvent: kp.lists?.[0]?.startTimeEndEvent || '',
                    endTimeEndEvent: kp.lists?.[0]?.endTimeEndEvent || '',
                    eventPlace: kp.eventPlace,
                    countOfPerson: kp.countOfPerson,
                    logisticsCost: kp.logisticsCost,
                    isWithinMkad: kp.isWithinMkad,
                    listTitle: kp.listTitle,
                },
                listsKp: kp.lists.map(list => ({
                    id: list.id,
                    rows: list.rows.map(row => ({
                        id: row.id,
                        countOfProduct: row.countOfProduct,
                        priceOfProduct: row.priceOfProduct,
                        product: row.product,
                        composition: row.composition,
                        productWeight: row.productWeight,
                        typeOfProduct: row.typeOfProduct,
                    }))
                }))
            };

            return res.json(formattedResponse);
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }

    async getLastKpNumber(req, res, next) {
        try {
            // Находим запись с максимальным kpNumber

            const lastKp = await Kp.findOne({
                order: [['kpNumber', 'DESC']], // Сортируем по убыванию
                attributes: ['kpNumber'], // Выбираем только поле kpNumber
            });

            if (!lastKp) {
                // Если записей нет, возвращаем null или начальное значение
                return res.json({ kpNumber: null });
            }

            // Возвращаем последний kpNumber
            return res.json(lastKp.kpNumber);
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;

            // Найти все списки по kpId
            const lists = await List.findAll({ where: { kpId: id } });

            // Удалить строки, привязанные к этим спискам
            const listIds = lists.map(list => list.id);
            await Row.destroy({ where: { listId: listIds } });

            // Удалить списки
            await List.destroy({ where: { kpId: id } });

            // Удалить сам КП
            const deleted = await Kp.destroy({ where: { id } });

            if (!deleted) {
                return next(ApiError.badRequest('КП с таким ID не найден'));
            }

            return res.json({ message: 'КП и все связанные данные удалены' });
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }

}

module.exports = new KpController()