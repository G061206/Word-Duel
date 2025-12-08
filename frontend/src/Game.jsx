import React, { useState, useEffect } from 'react';

export default function Game({ socket, roomCode, gameState }) {
    const [attackMode, setAttackMode] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const myPressure = gameState.myPressure || [];
    const myHand = gameState.myHand || [];
    const oppPressureCount = gameState.opponentPressureCount || 0;

    // Current Question is the first in the pressure queue
    const currentQuestion = myPressure.length > 0 ? myPressure[0] : null;

    const handleAnswer = (option) => {
        if (cooldown || attackMode) return;
        if (!currentQuestion) return;

        const isCorrect = option === currentQuestion.Definition;
        socket.emit('answer_question', {
            roomCode,
            word: currentQuestion.Word,
            isCorrect
        });

        if (isCorrect) {
            setLastResult('Correct! Attack now!');
            setAttackMode(true);
        } else {
            setLastResult('Wrong! Penalty...');
            setCooldown(true);
            setTimeout(() => {
                setCooldown(false);
                setLastResult(null);
            }, 2000);
        }
    };

    const handleAttack = (card) => {
        if (!attackMode) return;
        socket.emit('attack', {
            roomCode,
            cardWord: card.Word
        });
        setAttackMode(false);
        setLastResult('Attack Sent!');
        setTimeout(() => setLastResult(null), 1000);
    };

    return (
        <div className="game-container">
            {/* Opponent Area */}
            <div className="opponent-area">
                <h3>Opponent</h3>
                <div className="pressure-bar">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className={`pressure-slot ${i < oppPressureCount ? 'filled' : ''}`}
                        />
                    ))}
                </div>
                <p>Pressure: {oppPressureCount}/10</p>
            </div>

            {/* Battle Area (Center) */}
            <div className="battle-area">
                {lastResult && <h2>{lastResult}</h2>}

                {currentQuestion ? (
                    <div className={`question-modal ${cooldown ? 'locked' : ''}`}>
                        {cooldown && <div style={{ color: 'red' }}>LOCKED (2s)</div>}
                        <h2>{currentQuestion.Word}</h2>
                        <div className="options-grid">
                            {currentQuestion.options && currentQuestion.options.map((opt, i) => (
                                <button
                                    key={i}
                                    className="option-btn"
                                    onClick={() => handleAnswer(opt)}
                                    disabled={cooldown || attackMode}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2>Pressure Clear!</h2>
                        <p>Waiting for attacks...</p>
                    </div>
                )}
            </div>

            {/* Player Area */}
            <div className="player-area">
                <h3>Your Hand {attackMode && <span style={{ color: '#4CAF50' }}>(SELECT CARD TO ATTACK)</span>}</h3>
                <div className="hand">
                    {myHand.map((card, i) => (
                        <button
                            key={i}
                            className="hand-card"
                            onClick={() => handleAttack(card)}
                            style={{
                                borderColor: attackMode ? '#4CAF50' : '#646cff',
                                opacity: attackMode ? 1 : 0.7
                            }}
                            disabled={!attackMode}
                        >
                            <div style={{ fontWeight: 'bold' }}>{card.Word}</div>
                            <div style={{ fontSize: '0.8em' }}>{card.Definition}</div>
                        </button>
                    ))}
                </div>

                <h3>Your Pressure</h3>
                <div className="pressure-bar">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className={`pressure-slot ${i < myPressure.length ? 'filled' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
