import * as authController from '../controllers/auth.controller.js';

export default async function authRoutes(app) {
  app.post('/register', authController.registerUser);
  app.post('/login', authController.logIn);
}
