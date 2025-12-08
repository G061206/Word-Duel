import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './Lobby';
import Game from './Game';
import './index.css';

// Initialize socket
// When served by Nginx (same origin) or proxy, relative path works best.
// But Vite dev server is on 5173, backend on 3000.
// We need a conditional or just rely on proxy in dev too (vite.config proxy)?
// For Docker (Nginx), relative path "/" works because Nginx proxies /socket.io
// For Dev, we'll need to configure Vite Proxy or keep localhost.
// Let's use window.location.hostname logic or just "/" if we add Vite proxy.
// Simplest: defaults to "/" which works for Nginx. For local dev, we update vite.config.
const socket = io();


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
