import React, { useState, useEffect, useRef } from 'react';
import './Dialog.css';

const Dialog = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const transcriptElement = useRef(null);
  const analysisElement = useRef(null);
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
    } else {
      alert('Your browser does not support Web Speech API');
    }

    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        clearTimeout(silenceTimeoutRef.current);
        const newTranscript = event.results[event.resultIndex][0].transcript.trim();
        setTranscript(prev => prev + 'You: ' + newTranscript + '\n');
        setConversation(prev => [...prev, { role: 'user', content: newTranscript }]);

        // Set a timeout to detect 5 seconds of silence
        silenceTimeoutRef.current = setTimeout(() => {
          getAIResponse(newTranscript);
        }, 5000);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition && !isRecording) {
      setTranscript('');
      analysisElement.current.innerHTML = '';
      setLoading(false);
      recognition.start();
      setIsRecording(true);
      getAIResponse("Hello, let's start the conversation. Please ask me a question or tell me something about yourself.");
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
      clearTimeout(silenceTimeoutRef.current);
      analyzeConversation();
    }
  };

  const getAIResponse = async (userInput) => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_OPEN_API_KEY;
    if (!apiKey) {
      alert('API key is missing. Make sure to set your API key in the environment variables.');
      setLoading(false);
      return;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an IELTS examiner conducting a speaking test. Engage naturally with the user, providing thoughtful and relevant responses. Make sure to stay on topic based on the user's input, and ask follow-up questions wherever appropriate. Maintain the context of the entire conversation to ensure coherence." },
          ...conversation,
          { role: "user", content: userInput }
        ],
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      setLoading(false);
      setTranscript(prev => prev + 'Error: ' + response.statusText + '\n');
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    setLoading(false);

    if (data.choices && data.choices.length > 0) {
      const aiResponse = data.choices[0].message.content.trim();
      setTranscript(prev => prev + 'AI: ' + aiResponse + '\n');
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      speakText(aiResponse);
    } else {
      setTranscript(prev => prev + 'AI: No response available.\n');
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    utterance.onend = () => {
      console.log('Speech has finished');
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    synth.speak(utterance);
  };

  const analyzeConversation = async () => {
    setLoading(true);
    const apiKey = process.env.REACT_APP_OPEN_API_KEY;
    if (!apiKey) {
      alert('API key is missing. Make sure to set your API key in the environment variables.');
      setLoading(false);
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: `Analyze the following conversation and provide feedback based on the IELTS Speaking criteria. Here is the conversation:\n\n${conversation.map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`).join('\n')}` }],
        max_tokens: 2048,
        n: 1,
        stop: null,
        temperature: 1
      })
    });

    if (!response.ok) {
      setLoading(false);
      analysisElement.current.innerHTML = `<p>Error: ${response.statusText}</p>`;
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    setLoading(false);

    if (data.choices && data.choices.length > 0) {
      const formattedText = data.choices[0].message.content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      analysisElement.current.innerHTML = `<p>${formattedText}</p>`;
    } else {
      analysisElement.current.innerHTML = '<p>No analysis result available.</p>';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <a href="/" className="back-button">
          <img src="back-icon.png" alt="Back" className="icon" />
        </a>
      </header>
      <h1>Real-Time Conversation with AI</h1>
      <div id="conversation-container">
        <div ref={transcriptElement} id="transcript">{transcript}</div>
        <div id="loading" style={{ display: loading ? 'block' : 'none' }}>Loading...</div>
      </div>
      <div id="controls">
        <button onClick={startRecording} disabled={isRecording}>Start Conversation</button>
        <button onClick={stopRecording} disabled={!isRecording}>End Conversation</button>
      </div>
      <div ref={analysisElement} id="analysis"></div>
    </div>
  );
};

export default Dialog;