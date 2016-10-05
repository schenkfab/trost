import test from 'ava';
import mysql from 'mysql';
import faker from 'faker';
import {NotFoundError, ValidationError} from '../../../src/utils/cerr';

const pool = mysql.createPool(require('../config.test.json').database);

import UserServiceFn from '../../../src/services/user';


function genUser() {
  return {
    id: -1,
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: faker.internet.password()
  };
}

test('getUserBy*', async function (t) {
  const fakeUser = genUser();
  const UserService = UserServiceFn({connection: pool});
  const id = await UserService.saveUser(
    fakeUser.email,
    fakeUser.username,
    fakeUser.password
  );
  fakeUser.id = id;
  const user = await UserService.getUserById(id);
  t.deepEqual(fakeUser, user);
  try {
    await UserService.getUserById(-1);
    t.fail();
  } catch (err) {
    if (err instanceof NotFoundError) return t.pass();
    t.fail();
  }

  const fakeUserForEmail = genUser();
  const id2 = UserService.saveUser(
    fakeUserForEmail.email,
    fakeUserForEmail.username,
    fakeUserForEmail.password
  );
  fakeUserForEmail.id = id2;
  const user2 = await UserService.getUserByEmail(fakeUserForEmail.email);
  t.deepEqual(fakeUserForEmail, user2);
  try {
    await UserService.getUserByEmail('wOWOOWWOO');
    t.fail();
  } catch (err) {
    if (err instanceof NotFoundError) return t.pass();
    t.fail();
  }

});

test('saveUser', async function (t) {
  const UserService = UserServiceFn({connection: pool});
  const fakeUser = genUser();

  // I mean realistically these are more unit tests but I see no reason
  // in using a seperate file. Maybe later if things get more complex
  try {
    UserService.saveUser();
  } catch (err) {
    if (err instanceof ValidationError && err.message === 'EMAIL REQUIRED') {
      t.pass();
    } else {
      t.fail(err.stack);
    }
  }

  try {
    UserService.saveUser('my email');
  } catch (err) {
    if (err instanceof ValidationError && err.message === 'USERNAME REQUIRED') {
      t.pass();
    } else {
      t.fail(err.stack);
    }
  }

  try {
    UserService.saveUser('my email', 'my username');
  } catch (err) {
    if (err instanceof ValidationError && err.message === 'PASSWORD REQUIRED') {
      t.pass();
    } else {
      t.fail(err.stack);
    }
  }

  const id = await UserService.saveUser(fakeUser.email, fakeUser.username, fakeUser.password);
  const user = await UserService.getUserById(id);
  fakeUser.id = id;
  t.deepEqual(user, fakeUser);
});
