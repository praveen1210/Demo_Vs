export function generateCheckoutData() {
  return {
    firstName: 'John',
    lastName: 'Doe',
    zipCode: '600001'
  };
}

export function generateApiUser() {
  return {
    name: 'John Doe',
    job: 'Software Engineer'
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