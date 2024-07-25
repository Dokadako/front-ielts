import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Recorder from './Recorder';
import Analysis from './Analysis';
import './App.css';

import HeyGen from './HeyGen'; // Импорт компонента HeyGen

const App = () => {
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const heyGenRef = useRef(null);

  const askRandomQuestion = async () => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_OPEN_API_KEY; // Replace with your actual API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Please provide a random question from the IELTS Speaking test. Here is the format: Question" }],
        max_tokens: 50,
        n: 1,
        stop: null,
        temperature: 0.7
      })
    });

    const data = await response.json();
    setLoading(false);

    if (data.choices && data.choices.length > 0) {
      const question = data.choices[0].message.content;
      setQuestion(question);
      heyGenRef.current.speakText(question); // Speak the question
    } else {
      setQuestion('No question available.');
    }
  };

  const analyzeText = async (question, text) => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_OPEN_API_KEY; // Replace with your actual API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Analyze the following text based on IELTS Speaking criteria and provide feedback, including a score out of 9 for each criterion. Use paragraphs where necessary:\n\nQuestion: ${question}\n\nResponse: ${text}\n\nHere is the format:\n\n
            **Fluency and Coherence:**\n[feedback]\n
            Score: [score]/9\n\n
            **Lexical Resource:**\n
            [feedback]\nScore: [score]/9\n\n
            **Grammatical Range and Accuracy:**\n[feedback]\n
            Score: [score]/9\n\n
            **Pronunciation:**\n[feedback]\n
            Score: [score]/9\n\n
            **Overall Band Score:** [score]/9`
        }],
        max_tokens: 2048,
        n: 1,
        stop: null,
        temperature: 0.7
      })
    });

    const data = await response.json();
    setLoading(false);

    if (data.choices && data.choices.length > 0) {
      const formattedText = data.choices[0].message.content.split('\n\n').map((paragraph) => paragraph);
      setAnalysis(formattedText);
      heyGenRef.current.speakText(data.choices[0].message.content); // Speak the analysis
    } else {
      setAnalysis(['No analysis result available.']);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="back-button">
          <img src="back-icon.png" alt="Back" className="icon" /> </Link>
        <h1>IELTS Speaking Analyzer</h1>
      </header>
      <main className="main">
        <div className="HeyGen-container">
          <HeyGen ref={heyGenRef} />
        </div>
        <div className="content-left">
          <Recorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            askRandomQuestion={askRandomQuestion}
            analyzeText={analyzeText}
            question={question}
            handleSpeak={heyGenRef.current?.speakText}
          />
          <h2 className="heading">Analysis</h2>
          <Analysis
            analysis={analysis}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
