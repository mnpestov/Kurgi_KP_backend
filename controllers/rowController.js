const { Kp, Manager, List, Row } = require('../models/models')
const ApiError = require('../errors/ApiError')
const { log } = require('console')

class RowController {
    async create(req, res, next) {
        try {
            let {
                product,
                composition,
                productWeight,
                countOfProduct,
                priceOfProduct,
                listId,
                typeOfProduct
            } = req.body
            productWeight = productWeight === '' ? null : parseInt(productWeight)
            countOfProduct = countOfProduct === '' ? null : parseInt(countOfProduct)
            priceOfProduct = priceOfProduct === '' ? null : parseFloat(priceOfProduct)
            console.log("*******************",product,
                composition,
                productWeight,
                countOfProduct,
                priceOfProduct,
                listId,
                typeOfProduct,"***************");
            
            const row = await Row.create({
                product,
                composition,
                productWeight,
                countOfProduct,
                priceOfProduct,
                listId,
                typeOfProduct
            })

            return res.json(row)
        } catch (err) {
            next(ApiError.badRequest(err.message))
        }
    }

    async delete(req, res, next) {
        try {
            let { id } = req.params
            await Row.destroy({ where: { id } })
            return res.json({ message: 'Row deleted' })
        } catch (err) {
            next(ApiError.badRequest(err.message))
        }
    }

    async update(req, res, next) {
        try {
            let {
                id,
                product,
                composition,
                productWeight,
                countOfProduct,
                priceOfProduct,
                typeOfProduct
            } = req.body
            productWeight = productWeight === '' ? null : parseInt(productWeight)
            countOfProduct = countOfProduct === '' ? null : parseInt(countOfProduct)
            priceOfProduct = priceOfProduct === '' ? null : parseFloat(priceOfProduct)
            const updatedRow = await Row.update(
                {
                    product,
                    composition,
                    productWeight,
                    countOfProduct,
                    priceOfProduct,
                    typeOfProduct
                },
                { where: { id: id } }
            )
            return res.json(updatedRow)
        } catch (err) {
            next(ApiError.badRequest(err.message))
        }
    }
}

module.exports = new RowController()