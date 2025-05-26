import React, { useState, useEffect } from 'react';

interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

const scoreRanges: ScoreRange[] = [
  { min: 300, max: 579, label: 'Poor', color: '#ef4444' },
  { min: 580, max: 669, label: 'Fair', color: '#f97316' },
  { min: 670, max: 739, label: 'Good', color: '#facc15' },
  { min: 740, max: 799, label: 'Very Good', color: '#38bdf8' },
  { min: 800, max: 850, label: 'Excellent', color: '#4ade80' },
];

const calculateRotation = (score: number, minScore: number, maxScore: number): number => {
  const scorePercent = (score - minScore) / (maxScore - minScore);
  const angle = -90 + (scorePercent * 180);
  return Math.max(-90, Math.min(90, angle));
};

const getScoreRating = (score: number): string => {
  const range = scoreRanges.find(range => score >= range.min && score <= range.max);
  return range ? range.label : 'Unknown';
};

interface CreditScoreProps {
  score: number;
  minScore?: number;
  maxScore?: number;
  className?: string;
  darkMode?: boolean;
}

const CreditScore: React.FC<CreditScoreProps> = ({
  score,
  minScore = 300,
  maxScore = 850,
  className = '',
  darkMode = false,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [needleRotation, setNeedleRotation] = useState(0);
  const rating = getScoreRating(score);

  useEffect(() => {
    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = score / totalFrames;

    let currentFrame = 0;
    let currentScore = 0;

    const counter = setInterval(() => {
      currentFrame++;
      currentScore += increment;
      
      if (currentFrame === totalFrames) {
        clearInterval(counter);
        setDisplayScore(score);
      } else {
        setDisplayScore(Math.floor(currentScore));
      }
    }, frameDuration);

    // Animate needle
    const targetRotation = calculateRotation(score, minScore, maxScore);
    const startRotation = needleRotation;
    const difference = targetRotation - startRotation;
    const startTime = performance.now();
    
    const animateNeedle = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutElastic = (x: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
      };
      
      const currentRotation = startRotation + difference * easeOutElastic(progress);
      setNeedleRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animateNeedle);
      }
    };
    
    requestAnimationFrame(animateNeedle);

    return () => clearInterval(counter);
    // eslint-disable-next-line
  }, [score, minScore, maxScore]);

  return (
    <div
      className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'} ${className}`}
    >
      <h2 className={`text-xl font-semibold text-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Credit Score
      </h2>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[240px] mx-auto">
          <svg viewBox="0 0 200 120" className="w-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="75%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
            
            <circle
              cx="100"
              cy="100"
              r="80"
              fill={darkMode ? "#18181b" : "#f1f5f9"}
            />
            <path 
              d="M 30 100 A 70 70 0 1 1 170 100" 
              fill="none" 
              stroke="url(#gaugeGradient)" 
              strokeWidth="12" 
              strokeLinecap="round" 
            />
            
            <g transform={`rotate(${needleRotation}, 100, 100)`}>
              <path 
                d="M 100 30 L 96 100 L 104 100 Z" 
                fill={darkMode ? "#60a5fa" : "#1e40af"}
                className="drop-shadow-md transition-transform duration-300" 
              />
              <circle cx="100" cy="100" r="6" fill={darkMode ? "#60a5fa" : "#1e40af"} />
            </g>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-5">
            <div className={`text-3xl font-bold transition-all duration-300 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {displayScore}
            </div>
            
          </div>
          <div className='absolute inset-0 flex items-center justify-center top-40'>
            <div className={`text-sm font-medium uppercase tracking-wider mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
              {rating}
            </div>
          </div>
        </div>
        
        <div className="mt-6 w-full max-w-[280px] mx-auto">
          <div className={`flex justify-between text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>{minScore}</span>
            <span>{maxScore}</span>
          </div>
          
          <div className="grid grid-cols-5 gap-16">
            {scoreRanges.map((range, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div 
                  className="w-2 h-2 rounded-full mb-1.5"
                  style={{ backgroundColor: range.color }}
                />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{range.label}</span>
                <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{range.min}-{range.max}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-lg border w-full ${darkMode ? 'bg-blue-950 border-blue-900' : 'bg-blue-50 border-blue-100'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>Credit Score Insights</h3>
              <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Your score puts you in the "{rating}" category. This can help you qualify for better interest rates on loans and credit cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditScore;