import React, { useState } from 'react';
import { useRoommate } from '../../features/roommate/hooks/useRoommate';
import { RoommatePreferences } from '../../features/roommate/components/RoommatePreferences';
import { RoommateMatches } from '../../features/roommate/components/RoommateMatches';
import type { RoommatePreferences as PreferencesType } from '../../features/roommate/types/roommate.types';

const RoommatePage: React.FC = () => {
  const { preferences, matches, loading, error, updatePreferences, refresh } = useRoommate();
  const [saving, setSaving] = useState(false);

  const handlePreferenceUpdate = async (field: keyof PreferencesType, value: string | number) => {
    setSaving(true);
    try {
      await updatePreferences({ [field]: value });
      refresh(); // Refresh matches after preference change
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Find Your Perfect Roommate</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Preferences */}
          <div>
            <RoommatePreferences
              preferences={preferences}
              onUpdate={handlePreferenceUpdate}
              loading={loading || saving}
            />
          </div>
          
          {/* Right Column: Matches */}
          <div>
            <RoommateMatches matches={matches} loading={loading} />
          </div>
        </div>
        
        {/* Refresh button */}
        <div className="text-center mt-8">
          <button
            onClick={refresh}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Matches'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoommatePage;