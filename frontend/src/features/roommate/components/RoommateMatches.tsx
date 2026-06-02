import React, { useState } from "react";
import type { RoommateMatch } from "../types/roommateTypes";

interface Props {
  matches: RoommateMatch[];
  loading?: boolean;
  onStartConversation?: (match: RoommateMatch) => Promise<void> | void;
  onRequestRoommate?: (match: RoommateMatch) => Promise<void> | void;
  startingConversationForUserId?: string | null;
  requestingRoommateForUserId?: string | null;
}

export const RoommateMatches: React.FC<Props> = ({
  matches,
  loading,
  onStartConversation,
  onRequestRoommate,
  startingConversationForUserId,
  requestingRoommateForUserId,
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-2xl font-bold text-(--palette-deep)">
          Finding matches...
        </h2>
        <div className="py-8 text-center text-[15px] leading-relaxed text-(--palette-soft-purple)">
          Loading potential roommates...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-sm">
      <h2 className="mb-6 font-serif text-2xl font-bold text-(--palette-deep)">
        Roommate matches ({matches.length})
      </h2>

      {matches.length === 0 ? (
        <div className="py-8 text-center text-[15px] leading-relaxed text-(--palette-soft-purple)">
          <p>No matches found above 50%.</p>
          <p className="mt-2 text-sm leading-relaxed">
            Try adjusting your preferences to find more matches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const targetId = match.targetUserId;
            const cardId = targetId ? `target:${targetId}` : `row:${index}`;

            const budgetMin = match.profileSummary?.budgetMin ?? 0;
            const budgetMax = match.profileSummary?.budgetMax ?? null;
            const stayDurationMonths =
              match.profileSummary?.stayDurationMonths ?? null;
            const drinking = match.profileSummary?.drinking ?? "Not specified";
            const smoking = match.profileSummary?.smoking ?? "Not specified";
            const occupation =
              match.profileSummary?.occupation || "Not specified";
            const interests = match.profileSummary?.interests ?? [];
            const aboutMe = match.profileSummary?.aboutMe ?? "";
            const preferredLocations =
              match.profileSummary?.preferredLocations ?? [];

            const isExpanded = expandedCardId === cardId;

            return (
              <div
                key={cardId}
                className="cursor-pointer rounded-xl border border-(--palette-border) bg-(--palette-card-bg) p-4 transition-shadow hover:shadow-lg"
                onClick={() => setExpandedCardId(isExpanded ? null : cardId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {match.profilePictureUrl ? (
                        <img
                          src={match.profilePictureUrl}
                          alt={match.fullName || match.name || "User"}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--palette-purple) text-xl font-bold text-white">
                          {(match.fullName || match.name || "U")
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif text-lg font-bold text-(--palette-deep)">
                          {match.fullName || match.name}
                        </h3>
                        <p className="text-[12px] leading-relaxed text-(--palette-soft-purple)">
                          {match.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-(--palette-purple)">
                      {match.matchScore}%
                    </div>
                    <div className="text-[11px] text-(--palette-soft-purple)">
                      Match score
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

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-(--palette-border) pt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm leading-relaxed text-(--app-text)">
                      <div>
                        <span className="text-[12px] text-(--palette-soft-purple)">
                          Budget:
                        </span>{" "}
                        ETB {budgetMin} – {budgetMax ?? "Open"}
                      </div>
                      <div>
                        <span className="text-[12px] text-(--palette-soft-purple)">
                          Stay duration:
                        </span>{" "}
                        {stayDurationMonths
                          ? `${stayDurationMonths} months`
                          : "Not specified"}
                      </div>

                      <div>
                        <span className="text-[12px] text-(--palette-soft-purple)">
                          Drinking:
                        </span>{" "}
                        {drinking}
                      </div>
                      <div>
                        <span className="text-[12px] text-(--palette-soft-purple)">
                          Smoking:
                        </span>{" "}
                        {smoking}
                      </div>

                      <div>
                        <span className="text-[12px] text-(--palette-soft-purple)">
                          Occupation:
                        </span>{" "}
                        {occupation}
                      </div>
                    </div>

                    {preferredLocations.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                          Preferred locations
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {preferredLocations.map((loc) => (
                            <span
                              key={loc}
                              className="rounded bg-(--palette-chip-bg) px-2 py-1 text-[12px] text-(--palette-deep)"
                            >
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {interests.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                          Interests
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {interests.map((interest) => (
                            <span
                              key={interest}
                              className="rounded bg-(--palette-card-muted-bg) px-2 py-1 text-[12px] text-(--palette-purple)"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aboutMe && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                          About
                        </span>
                        <p className="mt-1 text-sm leading-relaxed text-(--app-text)">
                          {aboutMe}
                        </p>
                      </div>
                    )}

                    {match.propertyInfo &&
                    match.profileSummary?.profileType == "TYPE_A" ? (
                      <div className="rounded-lg border border-(--palette-purple) bg-(--palette-card-muted-bg) p-3">
                        <p className="font-serif text-sm font-bold text-(--palette-deep)">
                          Room available
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-(--palette-soft-purple)">
                          {match.propertyInfo.title}
                          {match.propertyInfo.city
                            ? ` • ${match.propertyInfo.city}`
                            : ""}
                        </p>
                        <a
                          href={`/properties/${match.propertyInfo.propertyId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-block rounded-lg bg-(--palette-purple) px-3 py-1.5 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          View room details →
                        </a>
                        {match.roommateCount !== null &&
                        match.roommateCount !== undefined ? (
                          <p className="mt-2 text-[12px] leading-relaxed text-(--palette-soft-purple)">
                            {match.roommateCount} roommate
                            {match.roommateCount !== 1 ? "s" : ""} already
                            living here
                          </p>
                        ) : null}
                        {match.leaseInfo?.remainingDays != null ? (
                          <p className="mt-1 text-[12px] leading-relaxed text-(--palette-soft-purple)">
                            Lease remaining: {match.leaseInfo.remainingDays} day
                            {match.leaseInfo.remainingDays === 1 ? "" : "s"}
                            {match.leaseInfo.leaseEndDate
                              ? ` • Ends ${new Date(
                                  match.leaseInfo.leaseEndDate,
                                ).toLocaleDateString()}`
                              : ""}
                          </p>
                        ) : match.leaseInfo?.leaseEndDate ? (
                          <p className="mt-1 text-[12px] leading-relaxed text-(--palette-soft-purple)">
                            Lease ends:{" "}
                            {new Date(
                              match.leaseInfo.leaseEndDate,
                            ).toLocaleDateString()}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {onRequestRoommate ? (
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await onRequestRoommate(match);
                          }}
                          disabled={requestingRoommateForUserId === targetId}
                          className="w-full rounded-lg border border-(--palette-purple) py-2 text-sm font-bold text-(--palette-purple) transition hover:bg-(--palette-chip-bg) disabled:opacity-60"
                        >
                          {requestingRoommateForUserId === targetId
                            ? "Requesting..."
                            : "Request roommate"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!onStartConversation) return;
                          await onStartConversation(match);
                        }}
                        disabled={
                          !onStartConversation ||
                          startingConversationForUserId === targetId
                        }
                        className="w-full rounded-lg bg-(--palette-purple) py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        {startingConversationForUserId === targetId
                          ? "Opening chat..."
                          : "Send message"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
