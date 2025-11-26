import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv"
import fs from "fs/promises"

dotenv.config();
let client = new OpenAI();
let instructions;

const server = express();
server.use(express.json({ limit: "50mb" }));

server.post('/', async (req, res) => {
    const prompt = req.body['content'];
    const images = req.body['images'];

    const enc = images.map(img => {
        return {
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${img}`
            }
        }
    });

    console.log(images);
    console.log(enc);

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { 'role': 'system', content: instructions },
            {
                'role': 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...enc
                ]

            }
        ]
    });
    res.json({ 'response': response.choices[0].message.content });
    // if (image) {
    // } else {
    //     const response = client.chat.completions.create({
    //         model: 'gpt-4o-mini',
    //         messages: [
    //             { 'role': 'system', content: instructions },
    //             { 'role': 'user', content: prompt }
    //         ]
    //     });
    //     res.json({ 'response': (await response).choices[0].message.content });
    // }

});

server.post('/login', async (req, res) => {
    const username = req.body['username'];
    const password = req.body['password'];
    if (username == 'aarya' && password == 'pass') {
        res.json({ 'msg': 'success' });
    } else {
        res.status(401).json({ 'msg': 'faliure' });
    }
});

(async () => {
    const buffer = await fs.readFile('./prompt.txt');
    instructions = buffer.toString();
    server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
        console.log('server started');
    });
})()