'use client';
import { useState, useEffect } from 'react';

const START_SECONDS = 8 * 3600 + 45 * 60 + 32; // cosmetic countdown, loops

function Box({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-alibaba-600 text-white text-sm sm:text-base font-bold rounded-md w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function CountdownTimer() {
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? START_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="flex items-center gap-2">
      <Box value={days} label="Days" />
      <Box value={hours} label="Hrs" />
      <Box value={mins} label="Mins" />
      <Box value={secs} label="Secs" />
    </div>
  );
}
