import React, { useState, useRef } from 'react';

const Recorder = ({ isRecording, setIsRecording, askRandomQuestion, analyzeText, question, handleSpeak }) => {
  const [transcript, setTranscript] = useState('');
  const recognition = useRef(null);

  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    recognition.current = new window.webkitSpeechRecognition();
  } else {
    alert('Your browser does not support Web Speech API');
  }

  recognition.current.continuous = true;
  recognition.current.interimResults = false;
  recognition.current.lang = 'ru-RU';

  recognition.current.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript;
    setTranscript((prev) => prev + transcript + ' ');
  };

  const startRecording = async () => {
    if (!isRecording) {
      setTranscript('');
      setIsRecording(true);
      recognition.current.start();
      await askRandomQuestion();
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      recognition.current.stop();
      setIsRecording(false);
      analyzeText(question, transcript);
    }
  };

  return (
    <div>
      <div className="button-group">
        <button className="button button-start" onClick={startRecording} disabled={isRecording}>Start Recording</button>
        <button className="button button-stop" onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
      </div>
      <div>
        <h3>Question:</h3>
        <p>{question}</p>
        <h3>Transcript:</h3>
        <p>{transcript}</p>
      </div>
    </div>
  );
};

export default Recorder;
