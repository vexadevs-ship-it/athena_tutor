"use client";

import { useState } from "react";
import { UserPlus, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

type FriendScore = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalScore: number;
  weeklyDelta: number;
};

const AVATAR_COLORS = [
  "bg-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]", // Rank 1 (Gold)
  "bg-gray-300 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.6)]",  // Rank 2 (Silver)
  "bg-orange-600 border-orange-700 shadow-[0_0_10px_rgba(234,88,12,0.6)]",// Rank 3 (Bronze)
  "bg-blue-400 border-blue-500", // Rest
  "bg-purple-400 border-purple-500",
  "bg-emerald-400 border-emerald-500",
];

export function FriendsLeaderboard({ friends }: { friends: FriendScore[] }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send invite");
        return;
      }
      toast.success("Friend request sent!");
      setInviteEmail("");
      setShowInvite(false);
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  const sorted = [...friends].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="relative overflow-hidden rounded-xl border border-athena-amber/20 bg-card/40 p-5 backdrop-blur-md shadow-lg h-full flex flex-col">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-athena-amber/5 blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="h-5 w-5 text-athena-amber drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Leaderboard
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
            <UserPlus className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              No rivals yet.<br/>Invite someone to a duel!
            </p>
          </div>
        ) : (
          sorted.map((friend, i) => (
            <motion.div 
              key={friend.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 p-2.5 transition-colors hover:bg-background/50 ${i < 3 ? 'shadow-sm' : ''}`}
            >
              <div className="relative flex items-center justify-center w-6 text-xs font-bold text-muted-foreground">
                {i === 0 && <Medal className="absolute h-6 w-6 text-amber-400 opacity-20" />}
                {i + 1}
              </div>
              <div
                className={`h-8 w-8 shrink-0 rounded-md border-2 ${AVATAR_COLORS[i] || AVATAR_COLORS[3]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {friend.displayName || "Unknown"}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm font-black tabular-nums text-foreground drop-shadow-sm">
                  {friend.totalScore} <span className="text-[10px] text-athena-amber font-bold">XP</span>
                </p>
                {friend.weeklyDelta > 0 && (
                  <p className="text-[10px] font-bold text-emerald-400">
                    +{friend.weeklyDelta}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-auto pt-2 border-t border-border/50">
        {showInvite ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <input
              type="email"
              placeholder="friend@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1 rounded-md border border-athena-amber/30 bg-background/50 px-3 py-1.5 text-sm outline-none focus:border-athena-amber focus:ring-1 focus:ring-athena-amber/50 transition-all placeholder:text-muted-foreground/50"
            />
            <Button size="sm" onClick={handleInvite} disabled={inviting} className="bg-athena-amber text-black hover:bg-amber-400 font-bold tracking-wide">
              {inviting ? "..." : "SEND"}
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 uppercase tracking-widest text-xs font-bold border-athena-amber/30 hover:border-athena-amber hover:bg-athena-amber/10 hover:text-athena-amber transition-all"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus className="h-4 w-4" />
            Challenge Friends
          </Button>
        )}
      </div>
    </div>
  );
}
