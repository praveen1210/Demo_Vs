import { faker } from '@faker-js/faker';

export function generateCheckoutData() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    zipCode: faker.location.zipCode(),
  };
}

export function generateApiUser() {
  // return {
  //   name: faker.person.fullName(),
  //   job: faker.person.jobTitle(),
  // };
 const timestamp = Date.now();
  return {
    name: `John Doe ${timestamp}`,
    job: `Software Engineer ${timestamp}`,
  };
}
export const errorMessages = {
  lockedUser: 'Epic sadface: Sorry, this user has been locked out.',
  emptyUsername: 'Epic sadface: Username is required',
  emptyPassword: 'Epic sadface: Password is required',
  emptyCredentials: 'Epic sadface: Username is required',
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  checkoutFirstNameRequired: 'Error: First Name is required',
  checkoutComplete: 'Thank you for your order!',
};
