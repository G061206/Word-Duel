import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './Lobby';
import Game from './Game';
import './index.css';

// Initialize socket outside component to avoid reconnects
// For MVP, hardcoded URL. In production, use env or relative path.
const socket = io('http://localhost:3000');

function App() {
  const [gameState, setGameState] = useState(null);
  const [screen, setScreen] = useState('lobby'); // lobby, game, finished
  const [roomCode, setRoomCode] = useState('');
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server', socket.id);
    });

    socket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode);
      // We know we are host if we get this after emitting create
      // But simpler: just show lobby with code
    });

    socket.on('player_joined', ({ message }) => {
      console.log(message);
    });

    socket.on('game_started', () => {
      setScreen('game');
    });

    socket.on('game_update', (state) => {
      setGameState(state);
    });

    socket.on('game_over', ({ winner }) => {
      setWinner(winner);
      setScreen('finished');
    });

    socket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('game_started');
      socket.off('game_update');
      socket.off('game_over');
      socket.off('error');
    };
  }, []);

  return (
    <div className="App">
      {screen === 'lobby' && (
        <Lobby socket={socket} joinedRoomCode={roomCode} setJoinedRoomCode={setRoomCode} />
      )}


      {screen === 'game' && gameState && (
        <Game socket={socket} roomCode={roomCode} gameState={gameState} />
      )}

      {screen === 'finished' && (
        <div className="card">
          <h1>Game Over</h1>
          <h2>{winner === socket.id ? 'You Won!' : 'Overloaded!'}</h2>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default App;
