import React, { useState, useEffect } from 'react';

const Timer = ({ isRecording, setIsRecording, stopRecording }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (!isRecording && seconds !== 0) {
      clearInterval(interval);
    }
    if (seconds === 120) { // 2 minutes
      clearInterval(interval);
      setIsRecording(false);
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, seconds, setIsRecording, stopRecording]);

  return (
    <div className="timer-container">
      <span className="timer">{`${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`}</span>
    </div>
  );
};

export default Timer;
