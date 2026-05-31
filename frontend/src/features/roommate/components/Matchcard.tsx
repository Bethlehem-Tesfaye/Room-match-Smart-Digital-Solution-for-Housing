import React from "react";
import type { RoommateMatch } from "../types/roommateTypes";

interface Props {
  match: RoommateMatch;
  onStartConversation: (match: RoommateMatch) => void;
  isStartingConversation: boolean;
}

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 75 ? "#1D9E75" : score >= 50 ? "#7F77DD" : "#E24B4A";

  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--palette-card-muted-bg)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-bold"
        style={{ color }}
      >
        {Math.round(score)}%
      </div>
    </div>
  );
};

const BreakdownBar = ({ label, value }: { label: string; value: number }) => {
  const color =
    value >= 75
      ? "bg-green-500"
      : value >= 50
        ? "bg-(--palette-purple)"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 flex-shrink-0 text-[11px] text-(--palette-soft-purple)">
        {label}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full bg-(--palette-section-bg)"
        style={{ height: 5 }}
      >
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 text-right text-[11px] text-(--palette-soft-purple)">
        {Math.round(value)}%
      </span>
    </div>
  );
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const MatchCard: React.FC<Props> = ({
  match,
  onStartConversation,
  isStartingConversation,
}) => {
  const name = match.targetUserProfile?.fullName || match.name || "Unknown";

  const profilePic = match.targetUserProfile?.profilePictureUrl;
  const initials = getInitials(name);

  const scoreAtoB: number = (match.snapshot as any)?.scoreAtoB ?? match.score;
  const scoreBtoA: number = (match.snapshot as any)?.scoreBtoA ?? match.score;

  const leaseInfo = match.leaseInfo;

  return (
    <div className="overflow-hidden rounded-[28px] border border-(--palette-border) bg-(--palette-card-bg) shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-5">
        {profilePic ? (
          <img
            src={profilePic}
            alt={name}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-(--palette-chip-bg) text-sm font-bold text-(--palette-purple)">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif font-bold text-(--palette-deep)">{name}</p>
          {leaseInfo && (
            <p className="text-[12px] leading-relaxed text-(--palette-soft-purple)">
              {leaseInfo.remainingDays} days left on lease
            </p>
          )}
        </div>
        <ScoreRing score={match.score} />
      </div>

      {/* Score breakdown */}
      <div className="space-y-2 border-t border-(--palette-border) px-5 py-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
          Compatibility breakdown
        </p>
        <BreakdownBar label="Your view" value={scoreAtoB} />
        <BreakdownBar label="Their view" value={scoreBtoA} />
        <BreakdownBar label="Mutual score" value={match.score} />
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-(--palette-border) px-5 py-3">
        <button
          type="button"
          onClick={() => onStartConversation(match)}
          disabled={isStartingConversation}
          className="flex-1 rounded-xl bg-(--palette-purple) py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isStartingConversation ? "Opening…" : "Message"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-(--palette-border) px-4 py-2.5 text-sm font-bold text-(--palette-deep) transition hover:bg-(--palette-section-bg)"
        >
          View profile
        </button>
      </div>
    </div>
  );
};
