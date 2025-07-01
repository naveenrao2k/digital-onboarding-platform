import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CibilScoringEngine } from '@/lib/cibil-scoring-engine';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

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
  score?: number;
  minScore?: number;
  maxScore?: number;
  className?: string;
  darkMode?: boolean;
  showDetails?: boolean;
}

const accountTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  PARTNERSHIP: 'Partnership',
  ENTERPRISE: 'Enterprise',
  LLC: 'Limited Liability Company',
};

const CreditScore: React.FC<CreditScoreProps> = ({
  score: propScore,
  minScore = 300,
  maxScore = 850,
  className = '',
  darkMode = false,
  showDetails = true,
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [cibilData, setCibilData] = useState<any>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [needleRotation, setNeedleRotation] = useState(0);
  const [showBvnInput, setShowBvnInput] = useState(false);
  const [bvnInput, setBvnInput] = useState('');
  const [bvnLoading, setBvnLoading] = useState(false);

  // Fetch CIBIL score data on component mount
  useEffect(() => {
    const fetchCibilScore = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First try to get existing score from API
        const response = await fetch('/api/user/cibil-score');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setScore(data.data.score);
            setCibilData({
              score: data.data.score,
              accountType: data.data.accountType,
              lastUpdated: data.data.lastUpdated,
              factors: data.data.factors || []
            });
            setHasExistingData(true);
            setError(null);
          } else {
            // No existing data in database
            setError('No credit score data available');
            setHasExistingData(false);
          }
        } else {
          // No existing data in database
          setError('No credit score data available');
          setHasExistingData(false);
        }
      } catch (error) {
        console.error('Error fetching CIBIL score:', error);
        setError('Failed to load credit score');
        setHasExistingData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCibilScore();
  }, [user]);

  const rating = getScoreRating(score || 0);

  useEffect(() => {
    if (loading) return;

    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (score || 0) / totalFrames;

    let currentFrame = 0;
    let currentScore = 0;

    const counter = setInterval(() => {
      currentFrame++;
      currentScore += increment;
      
      if (currentFrame === totalFrames) {
        clearInterval(counter);
        setDisplayScore(score || 0);
      } else {
        setDisplayScore(Math.floor(currentScore));
      }
    }, frameDuration);

    // Animate needle
    const targetRotation = calculateRotation(score || 0, minScore, maxScore);
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
  }, [score, minScore, maxScore, loading]);

  // Handle "Check Now" button click
  const handleCheckNow = async () => {
    setShowBvnInput(true);
    setBvnInput('');
  };

  // Handle BVN submission
  const handleBvnSubmit = async () => {
    if (!user) return;

    if (!bvnInput || bvnInput.length !== 11) {
      alert('Please enter a valid 11-digit BVN');
      return;
    }

    try {
      setBvnLoading(true);
      setError(null);

      const response = await fetch('/api/user/cibil-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bvn: bvnInput,
          accountType: 'INDIVIDUAL' // Default account type
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setScore(data.data.score);
          setCibilData({
            score: data.data.score,
            accountType: data.data.accountType,
            lastUpdated: data.data.lastUpdated,
            factors: data.data.factors || []
          });
          setHasExistingData(true);
          setError(null);
          setShowBvnInput(false);
          setBvnInput('');
        } else {
          setError(data.error || 'Failed to calculate credit score');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to calculate credit score');
      }
    } catch (error) {
      console.error('Error calculating CIBIL score:', error);
      setError('Failed to calculate credit score');
    } finally {
      setBvnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'} ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading credit score...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'} ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          CIBIL Credit Score
        </h2>
        
        {/* Check Now button - only show if we have existing data */}
        {hasExistingData && !showBvnInput && (
          <button
            onClick={handleCheckNow}
            disabled={loading}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Check Now'}
          </button>
        )}
      </div>

      {/* Show error message if no data available */}
      {error && !hasExistingData && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                No Credit Score Data Available
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                To get your CIBIL credit score, please provide your BVN below.
              </p>
              <button
                onClick={handleCheckNow}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Get My Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BVN Input Field */}
      {showBvnInput && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-800">
              Enter Your BVN
            </h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Please enter your 11-digit BVN to fetch your latest credit information.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                BVN (11 digits)
              </label>
              <input
                type="text"
                value={bvnInput}
                onChange={(e) => setBvnInput(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={11}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="12345678901"
                disabled={bvnLoading}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleBvnSubmit}
                disabled={bvnLoading || bvnInput.length !== 11}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
                  bvnLoading || bvnInput.length !== 11 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white flex items-center justify-center`}
              >
                {bvnLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Calculate Score</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowBvnInput(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={bvnLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show existing score if available */}
      {hasExistingData && (
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
            
            <div className="absolute inset-0 flex items-center justify-center">
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

          {/* Score Insights */}
          {showDetails && (
            <div className={`mt-6 p-4 rounded-lg border w-full ${darkMode ? 'bg-blue-950 border-blue-900' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>CIBIL Score Insights</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Your CIBIL score of {score} puts you in the "{rating}" category. 
                    {cibilData?.lastUpdated && (
                      <span> Last updated: {new Date(cibilData.lastUpdated).toLocaleDateString()}</span>
                    )}
                  </p>
                  {cibilData?.scoreChange && cibilData.scoreChange !== 0 && (
                    <p className={`text-xs mt-1 ${cibilData.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cibilData.scoreChange > 0 ? '+' : ''}{cibilData.scoreChange} points from last update
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Factors (if available) */}
          {showDetails && cibilData?.factors && (
            <div className={`mt-4 p-4 rounded-lg border w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Score Factors</h4>
              <div className="space-y-2">
                {Object.entries({
                  paymentHistory: 'Payment History',
                  creditUtilization: 'Credit Utilization',
                  creditHistoryLength: 'Credit History Length',
                  creditMix: 'Credit Mix',
                  newCredit: 'New Credit',
                }).map(([key, label]) => {
                  const factor = cibilData.factors[key];
                  if (!factor) return null;
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${factor.score || 0}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{factor.score || 0}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CreditScore;