import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.ENV || 'qa';
dotenv.config({ path: path.resolve(__dirname, `../.env.${envFile}`) });

export const config = {
  baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in',
  apiKey: process.env.API_KEY || 'free_user_3FdH2csW7PgSdi87vRUg45OMWp1',
  env: envFile,
};
