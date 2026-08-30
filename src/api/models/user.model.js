const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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

const userModel = mongoose.model('user', userSchema);