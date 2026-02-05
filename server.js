const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// API Key check
if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set in .env file');
}

// Proxy Endpoint
// Wake-up Endpoint
app.get('/api/ping', (req, res) => {
    res.status(200).send('pong');
});

// Proxy Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        // Enable streaming from OpenAI
        const requestBody = {
            ...req.body,
            stream: true
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API Error');
        }

        // Set headers for SSE-like behavior
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the response directly to the client
        response.body.pipe(res);

    } catch (error) {
        console.error('Proxy Error:', error);
        // If headers haven't been sent, send JSON error
        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    message: 'Internal Server Error',
                    details: error.message
                }
            });
        } else {
            // Stream was already started, end it
            res.end();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Securely proxying requests to OpenAI API');
});
