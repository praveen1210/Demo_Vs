import { test, expect } from '@playwright/test';
import { config } from '../config/env';

const apiBase = config.apiBaseUrl;

const headers = {
  'x-api-key': config.apiKey,
  'Content-Type': 'application/json'
};

test.describe('ReqRes API Tests', () => {

  test('GET /api/users?page=2', async ({ request }) => {

    const response = await request.get(`${apiBase}/api/users?page=2`, {
      headers
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    body.data.forEach((user: any) => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
    });

  });

  test('POST /api/users', async ({ request }) => {

    const payload = {
      name: 'Praveen',
      job: 'SDET'
    };

    const response = await request.post(`${apiBase}/api/users`, {
      headers,
      data: payload
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.name).toBe(payload.name);
    expect(Number(body.id)).not.toBeNaN();

  });

  test('PUT /api/users/2', async ({ request }) => {

    const response = await request.put(`${apiBase}/api/users/2`, {
      headers,
      data: {
        name: 'Praveen',
        job: 'Senior SDET'
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.updatedAt).toBeTruthy();

  });

  test('DELETE /api/users/2', async ({ request }) => {

    const response = await request.delete(`${apiBase}/api/users/2`, {
      headers
    });

    expect(response.status()).toBe(204);

    expect(await response.text()).toBe('');

  });

  test('POST /api/login - Valid Credentials', async ({ request }) => {

    const response = await request.post(`${apiBase}/api/login`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka'
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.token).toBeTruthy();

  });

  test('POST /api/login - Missing Password', async ({ request }) => {

    const response = await request.post(`${apiBase}/api/login`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in'
      }
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error).toBeTruthy();

  });

});