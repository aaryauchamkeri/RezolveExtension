import { AiOutlineSend } from 'react-icons/ai';
import './App.css'
import { useEffect, useState } from 'react';
import Login from './authLock/Login';
import Searches from './searchBody/search';
import { performSearch, sendConversationMessage } from './utils/requests';
import Messages from './messageBody/messages';


function App() {
  const [images, setImages] = useState([]);
  const [messages, setMessages] = useState([{ text: 'Hi! How can I help you today?', user: 0 }]);
  const [mode, setMode] = useState('search'); // 'search' or 'chat'
  const [searchResults, setSearchResults] = useState([]);
  const [input, setInput] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

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

  const sendQuery = async () => {
    let ip = input; // original query
    setInput("");
    setSearchResults([]);
    let res = await performSearch(ip);
    res = res.response;

    let results = [];

    results.push({ title: 'AI Overview', author: { name: 'Rezolve AI' }, text: res.summary, aiOverview: true });

    for (let i = 0; i < (res.results || []).length; i++) {
      results.push({
        title: res.results[i].file_name,
        author: res.results_authors ? res.results_authors[i] : null,
        text: res.results[i].highlight,
        time_stamp: res.results[i].timestamp,
        aiOverview: false
      });
    }

    setSearchResults(results);
  }

  useEffect(() => {
    const messageBody = document.getElementById('messageBody');
    if (messageBody && mode === 'chat') {
      messageBody.scrollTop = messageBody.scrollHeight;
    }
  }, [messages, mode])

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

            <div className='flex flex-row gap-x-4'>
              <span onClick={(e) => { setMode('search') }} className={'cursor-pointer text-base ' + (mode === 'search' ? 'font-bold text-blue-600 underline' : 'font-normal text-blue-400')}>
                Search 🔍
              </span>
              <div style={{ width: "1px", alignSelf: "stretch", background: "#ccc" }} />
              <span onClick={(e) => { setMode('chat') }} className={'cursor-pointer text-base ' + (mode === 'chat' ? 'font-bold text-blue-600 underline' : 'font-normal text-blue-400')}>
                Chat 💬
              </span>
            </div>
          </div>

          <div className='body '>
            {mode === 'search' ? <Searches results={searchResults} /> : <Messages messages={messages} />}
          </div>

          <div className='footer bg-white'>
            <input
              type='text'
              className='message_box'
              placeholder={'Enter ' + (mode === 'search' ? 'Query' : 'Message')}
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <AiOutlineSend
              className='button send_button'
              onClick={mode === 'search' ? sendQuery : sendMessage}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App
