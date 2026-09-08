import express from 'express' // Removed the curly braces here
import { authController } from '../controllers/auth.controller' 

const router = express.Router() 

router.post('/register', authController.registerUser) 
router.post('/login', authController.logIn)

export default router
