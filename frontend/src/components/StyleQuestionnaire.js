import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config';
 
const styleCategories = [
  {
    name: 'occasion',
    question: 'What occasions do you typically dress for?',
    options: [
      { value: 'casual', label: 'Casual everyday wear' },
      { value: 'work', label: 'Work/Professional settings' },
      { value: 'formal', label: 'Formal events' },
      { value: 'athletic', label: 'Athletic/Sports activities' },
      { value: 'mixed', label: 'A mix of different occasions' }
    ]
  },
  {
    name: 'style_influence',
    question: 'Which style aesthetic appeals to you most?',
    options: [
      { value: 'classic', label: 'Classic and timeless' },
      { value: 'trendy', label: 'Modern and on-trend' },
      { value: 'bohemian', label: 'Bohemian/Artistic' },
      { value: 'minimalist', label: 'Minimalist/Simple' },
      { value: 'vintage', label: 'Vintage/Retro inspired' },
      { value: 'streetwear', label: 'Streetwear/Urban' }
    ]
  },
  {
    name: 'fit_preference',
    question: 'What type of fit do you prefer for your clothing?',
    options: [
      { value: 'loose', label: 'Loose/Relaxed fit' },
      { value: 'regular', label: 'Regular/Standard fit' },
      { value: 'fitted', label: 'Fitted/Tailored' },
      { value: 'mixed', label: 'Varies depending on item' }
    ]
  },
  {
    name: 'color_palette',
    question: 'What colors do you typically wear?',
    options: [
      { value: 'neutrals', label: 'Neutrals (black, white, gray, beige)' },
      { value: 'earth_tones', label: 'Earth tones (brown, olive, rust)' },
      { value: 'bold_colors', label: 'Bold colors (red, blue, yellow)' },
      { value: 'pastels', label: 'Pastels (light pink, baby blue, mint)' },
      { value: 'varied', label: 'Wide variety of colors' }
    ]
  },
  {
    name: 'budget',
    question: 'What is your typical budget for clothing items?',
    options: [
      { value: 'budget', label: 'Budget-friendly/Affordable' },
      { value: 'mid_range', label: 'Mid-range' },
      { value: 'premium', label: 'Premium/High-end' },
      { value: 'mixed', label: 'Mix of price points depending on item' }
    ]
  },
  {
    name: 'pattern_preference',
    question: 'Do you prefer patterns or solid colors?',
    options: [
      { value: 'solids', label: 'Mostly solid colors' },
      { value: 'subtle_patterns', label: 'Subtle patterns (small stripes, dots)' },
      { value: 'bold_patterns', label: 'Bold patterns (floral, geometric)' },
      { value: 'mixed', label: 'Mix of patterns and solids' }
    ]
  },
  {
    name: 'comfort_importance',
    question: 'How important is comfort in your clothing choices?',
    options: [
      { value: 'very_important', label: 'Very important - comfort first' },
      { value: 'balanced', label: 'Balance of comfort and style' },
      { value: 'style_first', label: 'Style comes first, willing to sacrifice some comfort' }
    ]
  }
];
 
function StyleQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { token, refreshUser, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        if (!token) return;
        const response = await axios.get(apiUrl('/api/style/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.profile?.preferences) {
          setAnswers(response.data.profile.preferences);
        }
      } catch (err) {
        console.error('Failed to load style profile:', err);
      }
    };
    loadExistingProfile();
  }, [token]);
 
  const handleAnswer = (value) => {
    const currentCategory = styleCategories[currentStep].name;
    setAnswers((prev) => ({
      ...prev,
      [currentCategory]: value
    }));

    if (currentStep < styleCategories.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
 
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
 
  const handleSubmit = async () => {
    const currentCategory = styleCategories[currentStep].name;
    if (!answers[currentCategory]) {
      setError('Please select an option before continuing.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      // Configure axios with auth token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      // Send preferences to backend
      const response = await axios.post(
        apiUrl('/api/style/profile'),
        { preferences: answers },
        config
      );

      // Ensure auth context reflects latest persisted personalization state.
      const updatedUser = await refreshUser(token);
      if (!updatedUser) {
        setUser((prevUser) => ({
          ...prevUser,
          personalization_state: 'personalized',
          is_personalized: true
        }));
      }
      // Redirect to profile or results page
      navigate('/style-results', { 
        state: { 
          analysis: response.data.ai_analysis,
          preferences: answers,
          personalization_state: response.data.personalization_state || 'personalized'
        } 
      });
    } catch (err) {
      setError('Failed to save style profile. Please try again.');
      console.error('Style profile error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // If we've completed all steps but not submitted yet
  const isLastStep = currentStep === styleCategories.length - 1;
 
  const hasCurrentSelection = Boolean(answers[styleCategories[currentStep].name]);

  // Calculate progress percentage
  const progress = ((currentStep + 1) / styleCategories.length) * 100;
 
  return (
<div className="max-w-2xl mx-auto p-4">
<h1 className="text-3xl font-bold text-center mb-6">Your Style Profile</h1>
      {/* Progress bar */}
<div className="w-full h-2 bg-gray-200 rounded-full mb-8">
<div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
></div>
</div>
      {/* Question card */}
<div className="bg-white shadow-md rounded-lg p-6 mb-6">
<h2 className="text-xl font-semibold mb-4">
          {currentStep + 1}. {styleCategories[currentStep].question}
</h2>
<div className="space-y-3">
          {styleCategories[currentStep].options.map((option) => (
<button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`w-full text-left p-3 border rounded-md transition ${
                answers[styleCategories[currentStep].name] === option.value
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'hover:bg-blue-50'
              }`}
>
              {option.label}
</button>
          ))}
</div>
</div>
      {/* Navigation buttons */}
<div className="flex justify-between">
<button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded ${
            currentStep === 0 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
>
          Previous
</button>
        {isLastStep && (
<button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasCurrentSelection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
>
            {isSubmitting ? 'Analyzing...' : 'Create Style Profile'}
</button>
        )}
</div>
      {error && (
<div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
</div>
      )}
</div>
  );
}
 
export default StyleQuestionnaire;
