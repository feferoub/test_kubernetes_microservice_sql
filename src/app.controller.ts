import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
const Knex = require('knex');

let pool;

// [START cloud_sql_postgres_knex_create_tcp]
const createTcpPool = (config) => {
  // Extract host and port from socket address
  const dbSocketAddr = process.env.DB_HOST.split(':'); // e.g. '127.0.0.1:5432'

  // Establish a connection to the database
  return Knex({
    client: 'pg',
    connection: {
      user: process.env.DB_USER, // e.g. 'my-user'
      password: process.env.DB_PASS, // e.g. 'my-user-password'
      database: process.env.DB_NAME, // e.g. 'my-database'
      host: dbSocketAddr[0], // e.g. '127.0.0.1'
      port: dbSocketAddr[1], // e.g. '5432'
    },
    // ... Specify additional properties here.
    ...config,
  });
};

// Initialize Knex, a Node.js SQL query builder library with built-in connection pooling.
const createPool = () => {
  const config = {
    pool: {
      max: 5,
      min: 5,
      acquireTimeoutMillis: 6000,
    },
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    createRetryIntervalMillis: 200,
  };
  return createTcpPool(config);
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/post-db/:value')
  async postDb(@Param('value') value: string): Promise<string> {
    pool = pool || createPool();
    try {
      await pool('votes').insert({ name: value });
    } catch (e) {
      console.log('error inserting in db', e);
      return 'error';
    }
    return 'success';
  }

  @Get('/get-db')
  async getDb(): Promise<string> {
    try {
      pool = pool || createPool();
    } catch (e) {
      console.log('error createpool', e);
    }
    try {
      return await pool.select('name').from('votes');
    } catch (e) {
      console.log('error fetching db', e);
      return 'error';
    }
  }
}
