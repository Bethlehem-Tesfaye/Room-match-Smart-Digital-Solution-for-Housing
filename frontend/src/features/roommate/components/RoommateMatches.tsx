import React from "react";
import type { RoommateMatch } from "../types/roommate.types";

interface Props {
  matches: RoommateMatch[];
  loading?: boolean;
}

export const RoommateMatches: React.FC<Props> = ({ matches, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Finding Matches...</h2>
        <div className="text-center py-8">Loading potential roommates...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        Roommate Matches ({matches.length})
      </h2>

      {matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No matches found above 50%.</p>
          <p className="text-sm mt-2">
            Try adjusting your preferences to find more matches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.userId}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {match.profilePictureUrl ? (
                      <img
                        src={match.profilePictureUrl}
                        alt={match.fullName || match.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                        {(match.fullName || match.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {match.fullName || match.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{match.email}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {match.matchScore}%
                  </div>
                  <div className="text-xs text-gray-500">Match Score</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${match.matchScore}%` }}
                  />
                </div>
              </div>

              <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Profile →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
