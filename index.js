const express = require('express');
const sequelize = require('./db');
// const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./routes/index')

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use('/', router)

app.get('/', (req, res) => {
    res.send("Сервер запущен");
});

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        app.listen(PORT, () => console.log(`server started on port ${PORT}`))
    } catch (err) {
        console.log('Ошибка подключения к БД ' + err);
    }
}

start()