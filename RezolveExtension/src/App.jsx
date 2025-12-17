import { MdOutlinePhotoCamera } from 'react-icons/md';
import { AiOutlineSend } from 'react-icons/ai';
import './App.css'
import { useEffect, useState } from 'react';
import Login from './authLock/Login';
import Searches from './searchBody/search';
import { performSearch } from './utils/requests';


function App() {
  const [images, setImages] = useState([]);
  const [messages, setMessages] = useState([{ text: 'Hi! How can I help you today?', user: 0 }]);
  const [searchResults, setSearchResults] = useState([]);
  const [input, setInput] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const sendQuery = async (query) => {
    let ip = input;
    setInput("");
    let res = await performSearch(ip);
    res = res.response;
    let results = [];

    for (let i = 0; i < res.results.length; i++) {
      results.push({ title: res.results[i].file_name, author: res.results_authors[i], text: res.results[i].text });
    }

    console.log(results);
    setSearchResults(results);
  }

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
            />
          </div>

          <div className='body'>
            <Searches results={searchResults} />
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
              onClick={sendQuery}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App
