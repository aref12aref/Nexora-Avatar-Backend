import { exec } from "child_process";
import { promises as fs } from "fs";
import voice from "elevenlabs-node";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
/*You might need this (female voice) if required: tavIIPLplRB883FzWU0V: Mona voice ID*/
/* This is the voice id i used: A9ATTqUUQ6GHu0coCz8t */
/* const voiceID = "kgG7dCoKCfLehAPWkJOE"; */
const voiceID = "A9ATTqUUQ6GHu0coCz8t"; /**The voice ID from elevenlabs */

// functions
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            resolve(stdout);
        });
    });
};

const lipSyncMessage = async (message) => {
    const time = new Date().getTime();
    console.log(`Starting conversion for message ${message}`);
    await execCommand(
        `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
        // -y to overwrite the file
    );
    console.log(`Conversion done in ${new Date().getTime() - time}ms`);
    await execCommand(
        `./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
    );
    // -r phonetic is faster but less accurate
    console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

const readJsonTranscript = async (file) => {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
    const data = await fs.readFile(file);
    return data.toString("base64");
};

// voice controller
export const voiceController = async (req, res) => {
    res.send(await voice.getVoices(elevenLabsApiKey));
};

// chat controller
export const chatController = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        res.send({
            messages: [
                {
                    text: "مرحبا بك يا عزيزي. ماذا تريد أن تتعلم اليوم؟",
                    audio: await audioFileToBase64("./audios/intro_0.wav"),
                    lipsync: await readJsonTranscript("./audios/intro_0.json"),
                    facialExpression: "smile",
                    animation: "Talking",
                },
            ],
        });
        return;
    }
    if (!elevenLabsApiKey || openai.apiKey === "-") {
        res.send({
            messages: [
                {
                    text: "Please, don't forget to add your API keys!",
                    audio: await audioFileToBase64("./audios/api_0.wav"),
                    lipsync: await readJsonTranscript("./audios/api_0.json"),
                    facialExpression: "angry",
                    animation: "Talking",
                },
            ],
        });
        return;
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        max_tokens: 1000,
        temperature: 0.6,
        response_format: {
            type: "json_object",
        },
        messages: [
            {
                role: "system",
                content: `
        You are a friendly and patient teacher for young children. Remember 
        that you are communicating with children who are still learning about 
        the world. Focus on age-appropriate topics: Avoid discussing sensitive 
        subjects such as religion, politics, sex, violence, or any topics that 
        may be frightening or confusing for young children. Be positive and 
        encouraging: Use kind words and offer praise for children's efforts 
        and contributions. Keep it simple and fun: Explain concepts in a clear 
        and engaging way, using simple language and incorporating games or 
        stories. Address sensitive topics with care: If a child brings up a 
        sensitive topic, gently redirect their attention back to the lesson 
        or ask them to share a different thought or question. For example, 
        if a child asks about religion, you might say, "That's a very interesting 
        question! Let's talk more about it another time. For now, let's focus on 
        learning about [topic]." Your goal is to create a safe and enjoyable 
        learning environment for young children. You must always talk in Arabic.
        You will always reply with a JSON array of messages. With a maximum of 3 messages.
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, surprised, funnyFace, and default.
        The different animations are: Talking, Breathing Idle. 
        `,
            },
            {
                role: "user",
                content: userMessage || "Hello",
            },
        ],
    });
    let messages = JSON.parse(completion.choices[0].message.content);
    if (messages.messages) {
        messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
    }
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        // generate audio file
        const fileName = `./audios/message_${i}.mp3`; // The name of your audio file
        const textInput = message.text; // The text you wish to convert to speech
        await voice.textToSpeech(
            elevenLabsApiKey,
            voiceID,
            fileName,
            textInput
        );
        // generate lipsync
        await lipSyncMessage(i);
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = await readJsonTranscript(
            `./audios/message_${i}.json`
        );
    }

    res.send({ messages });
};
