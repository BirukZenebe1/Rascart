import React, { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config';

// Removed unused 'useAuth' import
 
function StyleResultsPage() {

  const location = useLocation();

  const navigate = useNavigate();

  // Removed unused 'user' variable

  const [analysis, setAnalysis] = useState(null);

  const [preferences, setPreferences] = useState(null);

  const [loading, setLoading] = useState(true);
 
  useEffect(() => {

    // Check if we have state data from the questionnaire

    if (location.state && location.state.analysis) {

      setAnalysis(location.state.analysis);

      setPreferences(location.state.preferences);

      setLoading(false);

    } else {

      // If no state (e.g., user refreshed page), fetch from API

      const fetchStyleProfile = async () => {

        try {

          const response = await fetch(apiUrl('/api/style/profile'), {

            headers: {

              'Authorization': `Bearer ${localStorage.getItem('token')}`

            }

          });

          const data = await response.json();

          if (data.has_profile) {

            setAnalysis(data.profile.ai_analysis);

            setPreferences(data.profile.preferences);

          } else {

            // Redirect to questionnaire if no profile exists

            navigate('/style-questionnaire');

          }

        } catch (error) {

          console.error('Error fetching style profile:', error);

        } finally {

          setLoading(false);

        }

      };

      fetchStyleProfile();

    }

  }, [location, navigate]);
 
  if (loading) {

    return (
<div className="flex justify-center items-center min-h-screen">
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
</div>

    );

  }
 
  // Format preference labels for display

  const getPreferenceLabel = (category, value) => {

    const categoryData = styleCategories.find(cat => cat.name === category);

    if (!categoryData) return value;

    const option = categoryData.options.find(opt => opt.value === value);

    return option ? option.label : value;

  };
 
  // Style categories matching the questionnaire

  const styleCategories = [

    {

      name: 'occasion',

      label: 'Typical Occasions',

      options: [

        { value: 'casual', label: 'Casual everyday wear' },

        { value: 'work', label: 'Work/Professional settings' },

        { value: 'formal', label: 'Formal events' },

        { value: 'athletic', label: 'Athletic/Sports activities' },

        { value: 'mixed', label: 'A mix of different occasions' }

      ]

    },

    // ... include all other categories from the StyleQuestionnaire component

  ];
 
  return (
<div className="max-w-4xl mx-auto p-4">
<h1 className="text-3xl font-bold text-center mb-6">Your Personal Style Profile</h1>

      {/* Style Board/Visual Preview */}
<div className="bg-gradient-to-r from-blue-100 to-purple-100 p-8 rounded-lg mb-8 flex flex-col items-center">
<h2 className="text-2xl font-semibold mb-4">Style Keywords</h2>
<div className="flex flex-wrap justify-center gap-2 mb-6">

          {analysis && analysis.keywords && analysis.keywords.map((keyword, index) => (
<span 

              key={index} 

              className="px-3 py-1 bg-white/70 rounded-full text-blue-800 font-medium"
>

              {keyword}
</span>

          ))}
</div>

        {/* Custom style board would go here - placeholder for now */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-lg">

          {[...Array(8)].map((_, i) => (
<div 

              key={i} 

              className="aspect-square bg-white/50 rounded-md animate-pulse"
></div>

          ))}
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Style Analysis */}
<div className="bg-white shadow-md rounded-lg p-6">
<h2 className="text-xl font-semibold mb-4">Your Style Analysis</h2>

          {analysis && (
<div className="prose max-w-none">
<p>{analysis.description}</p>
</div>

          )}
</div>

        {/* Your Preferences */}
<div className="bg-white shadow-md rounded-lg p-6">
<h2 className="text-xl font-semibold mb-4">Your Style Preferences</h2>

          {preferences && (
<ul className="space-y-3">

              {Object.entries(preferences).map(([category, value]) => (
<li key={category} className="flex justify-between">
<span className="font-medium">{category.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}:</span>
<span>{getPreferenceLabel(category, value)}</span>
</li>

              ))}
</ul>

          )}
</div>
</div>
<div className="mt-8 flex justify-center">
<button 

          onClick={() => navigate('/shop')}

          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
>

          Browse Personalized Recommendations
</button>
</div>
</div>

  );

}
 
export default StyleResultsPage;
 
