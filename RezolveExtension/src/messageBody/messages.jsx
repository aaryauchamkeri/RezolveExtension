import { useEffect, useRef, useState } from 'react';
import MessageBubble from './messagebubble'
import styles from './styles/messages.module.css'
import * as AdaptiveCards from 'adaptivecards'
import MarkdownIt from "markdown-it"
import { performSearch } from '../utils/requests';
import { AiOutlineSend } from 'react-icons/ai';

const SERVER = 'https://rezolvebackend.onrender.com';

const sendMessage = async (input, setMessages, setInput, images, setImages) => {
    const trimmed_text = input.trim();
    if (trimmed_text.length == 0) return;
    setMessages(prev => [...prev, { content: trimmed_text, role: 'user' }]);
    setInput("");

    // getting the screnshot
    const screenshot = await chrome.tabs.captureVisibleTab();
    const commaIdx = screenshot.indexOf(",");
    const screenshotBase64 = commaIdx >= 0 ? screenshot.slice(commaIdx + 1) : screenshot;

    let response = await fetch(SERVER, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "content": trimmed_text, "images": [...images, screenshotBase64], "messages": [...messages, { content: trimmed_text, role: 'user' }] })
    });
    let response_json = await response.json();
    setImages([]);
    setMessages(prev => [...prev, { content: response_json['response'], role: 'assistant' }]);
}

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [images, setImages] = useState([]);

    const callSendMessage = () => {
        sendMessage(input, setMessages, setInput, images, setImages);
    }

    return (
        <>
            <div id='messageBody' className={styles.main}>
                {messages.map(val => {
                    if (val.role == 'user') {
                        return (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'right' }}>
                                <MessageBubble text={val.content} />
                            </div>
                        )
                    } else {
                        return (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'left' }}>
                                <MessageBubble text={val.content} user={0} />
                            </div>
                        )
                    }
                })}
            </div>
            <div className={styles.footer + ' bg-white'}>
                <input
                    type='text'
                    className='message_box'
                    placeholder={'Enter'}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                />
                <AiOutlineSend
                    className='button send_button'
                    onClick={callSendMessage}
                />
            </div>
        </>
    )
}