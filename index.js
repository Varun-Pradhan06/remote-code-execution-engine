require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// NEW: Node.js Built-in Modules for File I/O and Terminal Commands
const fs = require('fs');
const { exec } = require('child_process');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const axios = require('axios');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/', (req, res) => {
    res.json({ status: "success", message: "Big-O Sandbox Engine is live!" });
});

// 2. Create User Endpoint
app.post('/api/users', async (req, res) => {
    try {
        const { email, password_hash } = req.body;
        const user = await prisma.user.create({
            data: {
                email: email,
                password_hash: password_hash
            }
        });
        res.status(201).json(user);
    } catch (error) {
        console.error("Database error:", error);
        // IF THIS LINE IS MISSING, THUNDER CLIENT WILL HANG FOREVER
        res.status(500).json({ error: "Failed to create user" }); 
    }
});

// 3. THE CODE EXECUTION & ML PREDICTION ENDPOINT
app.post('/api/execute', async (req, res) => {
    const { code, language, userId } = req.body;
    
    // 1. Support both C++ and Python
    if (language !== 'cpp' && language !== 'python') {
        return res.status(400).json({ error: "Unsupported language. Use 'cpp' or 'python'." });
    }
    if (!userId) {
        return res.status(400).json({ error: "userId is required to track the submission" });
    }

    let submission;
    try {
        submission = await prisma.submission.create({
            data: {
                userId: userId,
                source_code: code,
                language: language,
                status: "Running"
            }
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Failed to create submission record" });
    }

    const base64Code = Buffer.from(code).toString('base64');
    let command = "";

    // 2. Dynamically assign the Docker execution command
    if (language === 'cpp') {
        command = `docker run --rm gcc:latest bash -c "echo '${base64Code}' | base64 -d > temp.cpp && g++ temp.cpp -o a.out && ./a.out"`;
    } else if (language === 'python') {
        // We use python:3.10-slim for significantly faster container boot times
        command = `docker run --rm python:3.10-slim bash -c "echo '${base64Code}' | base64 -d > temp.py && python3 temp.py"`;
    }

    const startTime = Date.now();

    // We use Promise.all to run the Docker execution AND the Python API call AT THE SAME TIME
    try {
        const [executionResult, mlResponse] = await Promise.all([
            // Task 1: Docker Execution (Wrapped in a Promise)
            new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) reject(stderr || error.message);
                    else resolve(stdout);
                });
            }),
            
            // Task 2: Ping the Python Microservice
            axios.post('http://ml-worker:8000/predict', {
                code: code,
                language: language
            })
        ]);

        const executionTime = Date.now() - startTime;
        const predictedO = mlResponse.data.complexity; // Extracts "O(N)" from FastAPI

        // Update DB with both the Execution Time AND the ML Prediction
        await prisma.submission.update({
            where: { id: submission.id },
            data: { 
                status: "Success", 
                execution_time_ms: executionTime,
                predicted_o_n: predictedO
            }
        });

        res.json({ 
            output: executionResult, 
            predicted_complexity: predictedO,
            execution_time_ms: executionTime,
            status: "Success"
        });

    } catch (error) {
        // If Docker fails (compilation error) OR the Python API crashes
        const executionTime = Date.now() - startTime;
        await prisma.submission.update({
            where: { id: submission.id },
            data: { status: "Error", execution_time_ms: executionTime }
        });
        
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});