

import { auth0 } from '@/app/lib/auth0';
import { getParticipants, getAllParticipantsScores, getOrCreateActiveSeason, getRosterEntries } from '@/app/lib/actions';
import { isAdmin } from '@/app/lib/auth-utils';
import Image from 'next/image';

export default async function WeeklyLineupPage() {
	const session = await auth0.getSession();
	const isLoggedIn = !!session?.user;
	const userIsAdmin = isLoggedIn ? isAdmin(session.user) : false;
	const participants = await getParticipants();
	const season = await getOrCreateActiveSeason();
	const scores = await getAllParticipantsScores(season.id);

	// Determine current week (latest locked or 1)
	// For simplicity, use week 1 for now; can enhance with lock logic
	const currentWeek = 1;

	// Fetch each participant's picks for the current week
	const participantLineups = await Promise.all(participants.map(async (p) => {
		const entries = await getRosterEntries(p.id, season.id);
		const weekEntries = entries.filter(e => e.week === currentWeek);
		return {
			participant: p,
			entries: weekEntries,
			totalPoints: scores.find(s => s.participantId === p.id)?.totalPoints || 0,
		};
	}));

	// Order by total points descending
	participantLineups.sort((a, b) => b.totalPoints - a.totalPoints);

	// Helper functions for images
	const getTeamLogoUrl = (team: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;
	const getPlayerImageUrl = (espnId?: string | null) => espnId ? `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png` : null;

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold mb-4">Current Week Lineups</h2>
			<table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
				<thead>
					<tr>
						<th className="px-4 py-2">Participant</th>
						<th className="px-4 py-2">QB</th>
						<th className="px-4 py-2">RB</th>
						<th className="px-4 py-2">WR</th>
						<th className="px-4 py-2">FLEX</th>
						<th className="px-4 py-2">TEAM</th>
						<th className="px-4 py-2">Total Points</th>
					</tr>
				</thead>
				<tbody>
					{participantLineups.map(({ participant, entries, totalPoints }) => (
						<tr key={participant.id}>
							<td className="border px-4 py-2 font-semibold">{participant.name}</td>
							{['QB','RB','WR','FLEX','TEAM'].map(pos => {
								const entry = entries.find(e => e.position === pos);
								if (pos === 'TEAM' && entry?.pickedTeam) {
									return (
										<td key={pos} className="border px-4 py-2">
											<div className="flex flex-col items-center gap-1">
												<div className="relative w-10 h-10 mb-1">
													<Image src={getTeamLogoUrl(entry.pickedTeam)} alt={entry.pickedTeam} fill className="object-contain" unoptimized />
												</div>
												<span className="text-xs font-semibold">{entry.pickedTeam}</span>
											</div>
										</td>
									);
								} else if (entry?.playerName) {
									const imageUrl = entry.player?.espnId ? getPlayerImageUrl(entry.player.espnId) : null;
									return (
										<td key={pos} className="border px-4 py-2">
											<div className="flex items-center gap-2">
												{imageUrl && (
													<img src={imageUrl} alt={entry.playerName} className="w-8 h-8 rounded-full object-cover" />
												)}
												<span className="text-sm font-semibold">{entry.playerName}</span>
											</div>
										</td>
									);
								} else {
									return <td key={pos} className="border px-4 py-2 text-gray-400 italic">-</td>;
								}
							})}
							<td className="border px-4 py-2 font-bold text-green-700">{totalPoints}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
