'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  espnId?: string | null;
}

interface PlayerPickerProps {
  eligiblePlayers: Player[];
  onSelect: (player: Player | null) => void;
  onCancel: () => void;
  currentPlayer?: string;
}

export default function PlayerPicker({ 
  eligiblePlayers, 
  onSelect, 
  onCancel,
  currentPlayer 
}: PlayerPickerProps) {
  console.log('PlayerPicker rendered with', eligiblePlayers.length, 'players');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState(eligiblePlayers);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        const filtered = eligiblePlayers.filter(player =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.team.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPlayers(filtered);
      } else {
        setFilteredPlayers(eligiblePlayers);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, eligiblePlayers]);

  const getPlayerImageUrl = (espnId?: string | null) => {
    if (!espnId) return null;
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Player</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          autoFocus
        />

        {currentPlayer && (
          <button
            onClick={() => onSelect(null)}
            className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Selection
          </button>
        )}

        <div className="overflow-y-auto flex-1">
          {filteredPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No players found matching your search.' : 'No eligible players available.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPlayers.map((player) => {
                const imageUrl = getPlayerImageUrl(player.espnId);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={(e) => {
                      console.log('Button clicked for player:', player.name);
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('About to call onSelect with:', player);
                      onSelect(player);
                      console.log('onSelect called');
                    }}
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-600">
                          {player.position} - {player.team}
                        </p>
                      </div>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
