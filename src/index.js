import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Landing from './Landing';
import Dialog from './dialog';
import { Analytics } from "@vercel/analytics/react"

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/app" element={<App />} />
      <Route path="/" element={<Landing />} />
      <Route path='/dialog' element= {<Dialog />}/>
      <Analytics />
    </Routes>
  </Router>,
  document.getElementById('root')
);
