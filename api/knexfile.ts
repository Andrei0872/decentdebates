import * as dotenv from 'dotenv'

dotenv.config({
  path: '../.env'
});

export default {
  client: 'pg',
  seeds: {
    directory: './data/seeds',
  },
  connection: {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  }
}