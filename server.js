require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
app.get('/verify', (req, res) => {
    res.sendFile('verify.html', { root: '../frontend' });
});

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: String
});

const User = mongoose.model('User', userSchema);

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create verification token
        const verificationToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,  // In production, use a secure secret key from env variables
            { expiresIn: '24h' }
        );

        // Create new user
        const user = new User({
            email,
            password: hashedPassword,
            verified: false,
            verificationToken
        });

        await user.save();

        // Send verification email
        // Inside your signup endpoint, update the email sending part
        const verificationUrl = `http://localhost:3000/api/verify?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Verify your Brello account',
            html: `
                <h1>Welcome to Brello!</h1>
                <p>Thank you for signing up. Please click the link below to verify your account:</p>
                <a href="${verificationUrl}">Verify Your Account</a>
                <p>This link will expire in 24 hours.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ 
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Add this endpoint to check if an email exists
app.get('/api/check-email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ 
            email: req.params.email,
            verified: true  // Only find verified users
        });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ error: 'Error checking email' });
    }
});

// Verify endpoint (make sure it's before the app.listen line)
app.get('/api/verify', async (req, res) => {
    try {
        const token = req.query.token;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find and update user
        const user = await User.findOne({ 
            email: decoded.email,
            verificationToken: token 
        });

        if (!user) {
            return res.status(404).json({ message: 'Invalid verification token' });
        }

        // Update user verification status
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();

        // Redirect to login page with success message
        res.redirect('/login.html?verified=true');
    } catch (error) {
        console.error('Verification error:', error);
        res.redirect('/login.html?verified=false');
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        console.log('Received login request:', req.body); // New log
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        console.log('User found:', user ? 'yes' : 'no'); // New log
        
        if (!user || !user.verified) {
            console.log('User not found or not verified'); // New log
            return res.status(400).json({ message: 'Invalid login credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword); // New log
        
        if (!validPassword) {
            console.log('Invalid password'); // New log
            return res.status(400).json({ message: 'Invalid login credentials' });
        }

        console.log('Login successful'); // New log
        // Send success response
        res.json({ message: 'Logged in successfully' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Token Verification endpoint
app.get('/api/verify-token', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Endpoint to view unverified users
app.get('/api/unverified-users', async (req, res) => {
    try {
        const unverifiedUsers = await User.find({ verified: false });
        res.json(unverifiedUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Endpoint to delete an unverified user
app.delete('/api/delete-user/:email', async (req, res) => {
    try {
        await User.deleteOne({ email: req.params.email });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// Get shared boards for a user
// Add this new endpoint in server.js
app.get('/api/shared-boards/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        console.log('Fetching shared boards for:', userEmail);
        
        // Get all users
        const allUsers = await User.find();
        let sharedBoards = [];
        
        // Loop through all users
        for (const user of allUsers) {
            const userBoards = JSON.parse(localStorage.getItem(user.email) || '[]');
            
            // Find boards shared with the requesting user
            const sharedWithUser = userBoards.filter(board => 
                board.sharedWith && 
                board.sharedWith.includes(userEmail)
            );
            
            if (sharedWithUser.length > 0) {
                sharedBoards = [...sharedBoards, ...sharedWithUser];
            }
        }
        
        console.log('Found shared boards:', sharedBoards);
        res.json(sharedBoards);
    } catch (error) {
        console.error('Error fetching shared boards:', error);
        res.status(500).json({ message: 'Error fetching shared boards' });
    }
});

// Create/update board
// Add or update this endpoint in server.js
app.post('/api/boards', async (req, res) => {
    try {
        console.log('Received board data:', req.body);
        const boardData = req.body;
        
        // Create new board
        const board = new Board({
            id: Date.now().toString(),
            title: boardData.title,
            color: boardData.color,
            owner: boardData.owner,
            sharedWith: [],
            lists: []
        });

        // Save to database
        await board.save();
        console.log('Board saved:', board);
        
        res.json(board);
    } catch (error) {
        console.error('Error creating board:', error);
        res.status(500).json({ message: 'Error creating board', error: error.message });
    }
});

// Get shared boards
app.get('/api/shared-boards/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const sharedBoards = await Board.find({
            sharedWith: userEmail
        });
        res.json(sharedBoards);
    } catch (error) {
        console.error('Error fetching shared boards:', error);
        res.status(500).json({ message: 'Error fetching shared boards' });
    }
});

app.get('/api/boards/user/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const boards = await Board.find({ owner: userEmail });
        res.json(boards);
    } catch (error) {
        console.error('Error fetching user boards:', error);
        res.status(500).json({ message: 'Error fetching boards', error: error.message });
    }
});

// Get a specific board
/*app.get('/api/boards/:id', async (req, res) => {
    try {
        const board = await Board.findOne({ id: req.params.id });
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.json(board);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching board' });
    }
});*/

// Share a board
app.post('/api/share-board', async (req, res) => {
    try {
        const { boardId, shareWithEmail } = req.body;
        const board = await Board.findOne({ id: boardId });
        
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (!board.sharedWith) {
            board.sharedWith = [];
        }

        if (!board.sharedWith.includes(shareWithEmail)) {
            board.sharedWith.push(shareWithEmail);
            await board.save();
        }

        res.json({ message: 'Board shared successfully' });
    } catch (error) {
        console.error('Error sharing board:', error);
        res.status(500).json({ message: 'Error sharing board' });
    }
});

app.post('/api/boards', async (req, res) => {
    try {
        const boardData = req.body;
        const board = new Board(boardData);
        await board.save();
        res.json(board);
    } catch (error) {
        console.error('Error creating board:', error);
        res.status(500).json({ message: 'Error creating board' });
    }
});

// Add this near your User schema
const boardSchema = new mongoose.Schema({
    id: String,
    title: String,
    color: String,
    owner: String,
    sharedWith: [String],
    lists: [{
        id: String,
        name: String,
        cards: [{
            id: String,
            title: String
        }]
    }]
});

const Board = mongoose.model('Board', boardSchema);