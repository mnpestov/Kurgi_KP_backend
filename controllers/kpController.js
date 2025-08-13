const { Kp, Manager, List, Row } = require('../models/models')
const ApiError = require('../errors/ApiError')
const { log } = require('console')
const { literal } = require('sequelize');

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

        // хелперы
        const trimTime = (t) => (t ? String(t).slice(0, 5) : '');
        const safeDate = (d) => d || null;

        try {
            const kp = await Kp.findOne({
                where: { kpNumber: id },
                include: [
                    {
                        model: List,
                        attributes: [
                            'id',
                            'startEvent', 'endEvent',
                            'startTimeStartEvent', 'endTimeStartEvent',
                            'startTimeEndEvent', 'endTimeEndEvent',
                            'eventPlace', 'countOfPerson', 'listTitle'
                        ],
                        include: [
                            {
                                model: Row,
                                attributes: [
                                    'id',
                                    'countOfProduct', 'priceOfProduct',
                                    'product', 'composition', 'productWeight',
                                    'typeOfProduct', 'order'
                                ],
                                separate: true,
                                order: [['order', 'ASC'], ['id', 'ASC']],
                            }
                        ]
                    },
                    // Если хочешь получить job/email/tel с бэка — раскомментируй include Manager:
                    // { model: Manager, attributes: ['role', 'email', 'tel'] }
                ],
                // фиксируем порядок списков и строк:
                order: [
                    [{ model: List, as: 'lists' }, 'id', 'ASC'],
                    // [{ model: List, as: 'lists' }, { model: Row, as: 'rows' }, 'order', 'ASC'],
                    // [{ model: List, as: 'lists' }, { model: Row, as: 'rows' }, 'id', 'ASC'],
                ],
            });

            if (!kp) {
                return res.status(404).json({ message: 'KP not found' });
            }

            // Берём времена из первого листа для formData (как у тебя было),
            // обрезаем секунды до HH:MM:
            const firstList = kp.lists && kp.lists[0];
            const formStartTimeStartEvent = firstList ? trimTime(firstList.startTimeStartEvent) : '';
            const formEndTimeStartEvent = firstList ? trimTime(firstList.endTimeStartEvent) : '';
            const formStartTimeEndEvent = firstList ? trimTime(firstList.startTimeEndEvent) : '';
            const formEndTimeEndEvent = firstList ? trimTime(firstList.endTimeEndEvent) : '';

            const formattedResponse = {
                formData: {
                    id: kp.id,
                    managerName: kp.managerName,
                    // Если включишь include Manager выше — эти поля придут; иначе на фронте бери из constants/managers
                    managerJobTitle: kp.manager?.role || '',
                    managerEmail: kp.manager?.email || '',
                    managerTel: kp.manager?.tel || '',
                    managerPhoto: '',

                    kpNumber: kp.kpNumber,
                    kpDate: safeDate(kp.kpDate),
                    contractNumber: kp.contractNumber,
                    contractDate: safeDate(kp.contractDate),

                    startEvent: safeDate(kp.startEvent),
                    endEvent: safeDate(kp.endEvent),

                    // времена для превью из первого листа (как было) + HH:MM
                    startTimeStartEvent: formStartTimeStartEvent,
                    endTimeStartEvent: formEndTimeStartEvent,
                    startTimeEndEvent: formStartTimeEndEvent,
                    endTimeEndEvent: formEndTimeEndEvent,

                    eventPlace: kp.eventPlace,
                    countOfPerson: kp.countOfPerson,
                    logisticsCost: kp.logisticsCost,
                    isWithinMkad: kp.isWithinMkad,
                    listTitle: kp.listTitle,
                },
                // также возвращаем детальные данные каждого листа
                listsKp: kp.lists.map((list) => ({
                    id: list.id,
                    startEvent: safeDate(list.startEvent),
                    endEvent: safeDate(list.endEvent),
                    startTimeStartEvent: trimTime(list.startTimeStartEvent),
                    endTimeStartEvent: trimTime(list.endTimeStartEvent),
                    startTimeEndEvent: trimTime(list.startTimeEndEvent),
                    endTimeEndEvent: trimTime(list.endTimeEndEvent),
                    eventPlace: list.eventPlace,
                    countOfPerson: list.countOfPerson,
                    listTitle: list.listTitle,
                    rows: (list.rows || []).map((row) => ({
                        id: row.id,
                        countOfProduct: row.countOfProduct,
                        priceOfProduct: row.priceOfProduct,
                        product: row.product,
                        composition: row.composition,
                        productWeight: row.productWeight,
                        typeOfProduct: row.typeOfProduct,
                        order: row.order,
                    })),
                })),
            };

            return res.json(formattedResponse);
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }


    async getLastKpNumber(req, res, next) {
        try {
            // Сортируем по числовому значению kpNumber
            const lastKp = await Kp.findOne({
                attributes: ['kpNumber'],
                order: [literal(`CAST("kpNumber" AS INTEGER) DESC`)],
            });

            // Если записей нет — вернём "0" (фронт добавит +1 и получит "1")
            const last = lastKp?.kpNumber;
            const lastNum = Number.parseInt(String(last ?? ''), 10);
            const safe = Number.isFinite(lastNum) ? String(lastNum) : '0';

            return res.json(safe); // <-- как и прежде, просто строка, например "9"
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

    async getLastFive(req, res, next) {
        try {
            // Запрос последних 5 КП по дате (самые новые)
            const kps = await Kp.findAll({
                order: [['kpNumber', 'DESC']],
                limit: 6,
                attributes: ['id', 'kpNumber', 'kpDate', 'startEvent', 'eventPlace']
            });
            return res.json(kps);
        } catch (err) {
            next(err);  // обработка ошибки (либо ApiError)
        }
    }

    async update(req, res, next) {
        const kpNumber = req.params.kpNumber;
        let {
            kpDate,
            contractNumber,
            contractDate,
            startEvent,
            endEvent,
            eventPlace,
            countOfPerson,
            isWithinMkad,
            logisticsCost,
            listTitle,
            managerName,
        } = req.body;

        try {
            // нормализация
            const normDate = d => (d ? String(d).slice(0, 10) : null); // ожидаем YYYY-MM-DD
            const normBool = v => (typeof v === 'boolean' ? v : v === 'true');
            const normStr = v => (v == null ? null : String(v));

            const payload = {
                // kpNumber — НЕ трогаем, мы апдейтим по нему
                kpDate: normDate(kpDate),
                contractNumber: normStr(contractNumber),
                contractDate: normDate(contractDate),
                startEvent: normDate(startEvent),
                endEvent: normDate(endEvent),
                eventPlace: normStr(eventPlace),
                countOfPerson: normStr(countOfPerson), // модель ожидает STRING
                isWithinMkad: normBool(isWithinMkad),
                logisticsCost: logisticsCost == null ? null : Number(logisticsCost),
                listTitle: normStr(listTitle),
                managerName: normStr(managerName),
            };

            const [updatedCount, [updated]] = await Kp.update(
                payload,
                { where: { kpNumber: String(kpNumber) }, returning: true }
            );

            if (!updatedCount) {
                return next(ApiError.badRequest('КП с таким номером не найдено'));
            }

            return res.json({ message: 'КП успешно обновлено', kp: updated });
        } catch (err) {
            next(ApiError.badRequest(err.message));
        }
    }


}

module.exports = new KpController()