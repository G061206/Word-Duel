import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Lobby({ socket, joinedRoomCode, setJoinedRoomCode }) {
    const [inputCode, setInputCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (joinedRoomCode) {
            // If we have a code but didn't type it (created), we are host
            // Simple heuristic for now.
            // Better: socket 'room_created' sets isHost=true in App? 
            // Let's assume if we created it, we are host.
        }
    }, [joinedRoomCode]);

    const createRoom = () => {
        socket.emit('create_room');
        setIsHost(true);
    };

    const joinRoom = () => {
        if (inputCode) {
            socket.emit('join_room', inputCode);
            setJoinedRoomCode(inputCode);
            setIsHost(false);
        }
    };

    const startGame = () => {
        socket.emit('start_game', joinedRoomCode);
    };

    const handleUpload = async () => {
        if (!file || !joinedRoomCode) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            setStatus('Uploading...');
            await axios.post(`http://localhost:3000/upload/${joinedRoomCode}`, formData);
            setStatus('Upload Successful!');
        } catch (e) {
            setStatus('Upload Failed');
            console.error(e);
        }
    };

    return (
        <div className="card">
            <h1>Word Duel</h1>
            {!joinedRoomCode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <button onClick={createRoom}>Create Room</button>
                    </div>
                    <div>
                        <input
                            placeholder="Enter Room Code"
                            value={inputCode}
                            onChange={e => setInputCode(e.target.value)}
                        />
                        <button onClick={joinRoom}>Join Room</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2>Room: {joinedRoomCode}</h2>
                    <p>Status: {status}</p>

                    {isHost ? (
                        <div style={{ border: '1px solid #444', padding: '10px' }}>
                            <h3>Host Controls</h3>
                            <input type="file" onChange={e => setFile(e.target.files[0])} accept=".csv" />
                            <button onClick={handleUpload} disabled={!file}>Upload CSV</button>
                            <br /><br />
                            <button onClick={startGame} className="start-btn" style={{ backgroundColor: '#4CAF50' }}>Start Game</button>
                        </div>
                    ) : (
                        <p>Waiting for host to start...</p>
                    )}
                </div>
            )}
        </div>
    );
}
