import { AiOutlineSend } from 'react-icons/ai';
import './App.css'
import { useEffect, useState } from 'react';
import Login from './authLock/Login';
import Search from './searchBody/search';
import Messages from './messageBody/messages';

const SERVER = 'https://rezolvebackend.onrender.com';

function App() {
  const [images, setImages] = useState([]);
  const [messages, setMessages] = useState([{ content: 'Hi! How can I help you today?', role: 'assistant' }]);
  const [mode, setMode] = useState('chat'); // 'search' or 'chat'
  const [disabled, setDisabled] = useState(false);
  const [renderer, setRenderer] = useState(5e-324);
  const [searchResults, setSearchResults] = useState([]);
  const [input, setInput] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

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
              style={{ width: '2.35rem', height: '2rem' }}
            />

            <button className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap"
              onClick={(e) => { setRenderer(val => val + 1); }}
              disabled={disabled}
            >
              <i class="fa-solid fa-magnifying-glass"></i>New Search
            </button>
          </div>

          {/* <Messages /> */}
          <Search renderer={renderer} setDisabler={setDisabled} />

          {/* <div className='footer bg-white'>
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
          </div> */}
        </div>
      )}
    </>
  );
}

export default App
