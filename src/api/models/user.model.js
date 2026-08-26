const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    role: {
        type: String,
        enum: ['owner', 'viewer', 'responder', 'admin'],
        default: 'viewer',
        required: true
    },

    password:{
        type: String,
        required: true
    }

})