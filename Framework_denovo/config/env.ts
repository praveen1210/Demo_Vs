import dotenv from 'dotenv';
import path from 'path';
const env = process.env.ENV || 'qa';

dotenv.config({
  path: path.resolve(__dirname, `../.env.${env}`)
});

export const config = {
  baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in',
  apiKey: process.env.API_KEY || ''
};