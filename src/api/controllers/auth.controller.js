import { userModel } from '../models/user.model'
import { bcrypt } from 'bcryptjs'

const jwt = require('jsonwebtoken')

async function registerUser(req, res) {

    const { email, role = "user", password } = req.body

    const userAlreadyExists = await userModel.findOne({ email });
    if (userAlreadyExists) {
        return res.status(409).json({ message: "user already exists" })
    }

    const hash = bcrypt.hash(password, 10);
    const user = await userModel.create({
        email,
        password: hash,
        role
    })

    const token = jwt.sign({
        id: user._id,
        role: user.role,
    }, process.env.JWT_SECRET)

    res.cookie('token', token)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }
    })
}

async function logIn(req, res) {
    const { email, password, role } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        res.status(401).json({ message: "Invalid Credentials" })
    }

    const isPasswordValid = bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid Credentials" })
    }

    const token = jwt.sign({
        id: user._id,
        role: user.role,

    }, process.env.JWT_SECRET)

    res.cookie('token', token)

    res.status(201).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }
    })

}

async function logOut(req, res) {

    
}

module.exports = { registerUser, logIn };