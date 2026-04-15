import React, { useState } from "react";
import type { RoommateMatch } from "../types/roommate.types";

interface Props {
  matches: RoommateMatch[];
  loading?: boolean;
  onStartConversation?: (match: RoommateMatch) => Promise<void> | void;
  startingConversationForUserId?: string | null;
}

export const RoommateMatches: React.FC<Props> = ({
  matches,
  loading,
  onStartConversation,
  startingConversationForUserId,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<RoommateMatch | null>(
    null,
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-(--palette-deep)">
          Finding Matches...
        </h2>
        <div className="py-8 text-center text-(--palette-soft-purple)">
          Loading potential roommates...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-(--palette-deep)">
        Roommate Matches ({matches.length})
      </h2>

      {matches.length === 0 ? (
        <div className="py-8 text-center text-(--palette-soft-purple)">
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
              className="cursor-pointer rounded-xl border border-(--palette-border) bg-(--palette-card-bg) p-4 transition-shadow hover:shadow-lg"
              onClick={() =>
                setSelectedMatch(
                  selectedMatch?.userId === match.userId ? null : match,
                )
              }
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--palette-purple) text-xl font-bold text-white">
                        {(match.fullName || match.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-(--palette-deep)">
                        {match.fullName || match.name}
                      </h3>
                      <p className="text-sm text-(--palette-soft-purple)">
                        {match.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-(--palette-purple)">
                    {match.matchScore}%
                  </div>
                  <div className="text-xs text-(--palette-soft-purple)">
                    Match Score
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-(--palette-border) pt-3">
                <div className="h-2 w-full rounded-full bg-(--palette-card-muted-bg)">
                  <div
                    className="h-2 rounded-full bg-(--palette-purple) transition-all duration-500"
                    style={{ width: `${match.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {selectedMatch?.userId === match.userId && (
                <div className="mt-4 space-y-3 border-t border-(--palette-border) pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-(--palette-deep)">
                        Budget:
                      </span>{" "}
                      ${match.budgetMin} - ${match.budgetMax}
                    </div>
                    <div>{match.stayDurationMonths} months</div>
                    <div>
                      <span className="font-semibold">Drinking:</span>{" "}
                      {match.drinking}
                    </div>
                    <div>
                      <span className="font-semibold">Occupation:</span>{" "}
                      {match.occupation}
                    </div>
                  </div>

                  {match.preferredLocations.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-(--palette-deep)">
                        Preferred Locations:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {match.preferredLocations.map((loc) => (
                          <span
                            key={loc}
                            className="rounded bg-(--palette-chip-bg) px-2 py-1 text-xs text-(--palette-deep)"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.interests.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-(--palette-deep)">
                        Interests:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {match.interests.map((interest) => (
                          <span
                            key={interest}
                            className="rounded bg-(--palette-card-muted-bg) px-2 py-1 text-xs text-(--palette-purple)"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.aboutMe && (
                    <div>
                      <span className="text-sm font-semibold text-(--palette-deep)">
                        About:
                      </span>
                      <p className="mt-1 text-sm text-(--palette-soft-purple)">
                        {match.aboutMe}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (!onStartConversation) return;
                      await onStartConversation(match);
                    }}
                    disabled={
                      !onStartConversation ||
                      startingConversationForUserId === match.userId
                    }
                    className="mt-2 w-full rounded-lg bg-(--palette-purple) py-2 text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {startingConversationForUserId === match.userId
                      ? "Opening chat..."
                      : "Send Message"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
