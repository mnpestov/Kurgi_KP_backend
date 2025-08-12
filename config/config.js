require('dotenv').config();

const base = {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
};

module.exports = {
  development: { ...base },
  test:        { ...base },
  production:  { ...base },
};
