// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { MdOutlinePhotoCamera } from 'react-icons/md';
import { AiOutlineSend } from 'react-icons/ai';
import './App.css'

function App() {
  return (
    <>
      <div id='root'>
        <div className='header'>
          <img src='./rezolve_logo.png' style={{ width: '2.2rem', height: '2rem' }} />
        </div>
        <div className='body'>
          <img src='./image.png'>
          </img>
        </div>
        <div className='footer'>
          <input type='text' className='message_box' placeholder='Enter Message' />
          <AiOutlineSend style={{ fontSize: '1.5rem', color: 'rgb(190,190,190)', flex: '2' }} />
        </div>
      </div>
    </>
  )
}

export default App
