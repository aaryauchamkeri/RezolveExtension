// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { MdOutlinePhotoCamera } from 'react-icons/md';
import { AiOutlineSend } from 'react-icons/ai';
import './App.css'
import Messages from './messageBody/messages';
import { useEffect, useState } from 'react';
import Login from './authLock/Login';


function App() {
  const [images, setImages] = useState([]);
  const [messages, setMessages] = useState([{ text: 'Hi! How can I help you today?', user: 0 }]);
  const [input, setInput] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const addImg = async () => {
    const screenshot = await chrome.tabs.captureVisibleTab();
    const commaIdx = screenshot.indexOf(",");
    const screenshotBase64 = commaIdx >= 0 ? screenshot.slice(commaIdx + 1) : screenshot;
    setImages(prev => [...prev, screenshotBase64]);
  }

  const sendMessage = async () => {
    const trimmed_text = input.trim();
    if (trimmed_text.length == 0) return;
    setMessages(prev => [...prev, { text: trimmed_text, user: 1 }]);
    setInput("");
    const screenshot = await chrome.tabs.captureVisibleTab();
    const commaIdx = screenshot.indexOf(",");
    const screenshotBase64 = commaIdx >= 0 ? screenshot.slice(commaIdx + 1) : screenshot;
    let response = await fetch('https://rezolvebackend.onrender.com', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ "content": trimmed_text, "images": [...images, screenshotBase64] })
    });
    let response_json = await response.json();
    setImages([]);
    setMessages(prev => [...prev, { text: response_json['response'], user: 0 }]);
  }


  useEffect(() => {
    const messageBody = document.getElementById('messageBody');
    if (messageBody) {
      messageBody.scrollTop = messageBody.scrollHeight;
    }
  }, [messages])


  return (
    <>
      {!loggedIn ? (
        <Login setLoggedIn={setLoggedIn} />
      ) : (
        <div id='root'>
          <div className='header'>
            <img
              src='./rezolve_logo.png'
              style={{ width: '2.2rem', height: '2rem' }}
            />

            <MdOutlinePhotoCamera
              className='button'
              onClick={addImg}
            />
          </div>

          <div className='body'>
            <Messages id='messageBody' messages={messages} />
          </div>

          <div className='footer'>
            <input
              type='text'
              className='message_box'
              placeholder='Enter Message'
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <AiOutlineSend
              className='button send_button'
              onClick={sendMessage}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App
