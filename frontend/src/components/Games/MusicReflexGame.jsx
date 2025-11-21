import React, { useState } from "react";
import { motion } from "framer-motion";

const MusicReflexGame = () => {
  const [score, setScore] = useState(0);
  const [activeBeats, setActiveBeats] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  // You can dynamically choose from your recommendation list later
  const tracks = [
    { id: "3n3Ppam7vgaVa1iaRUc9Lp", title: "Mr. Brightside" },
    { id: "7ouMYWpwJ422jRcDASZB7P", title: "Stay" },
    { id: "1P17dC1amhFzptugyAO7Il", title: "Blinding Lights" },
  ];

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameActive(true);

    // Pick a random track
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    setCurrentTrack(randomTrack);

    // Generate beats every 1s
    const beatInterval = setInterval(() => {
      if (Math.random() < 0.8) createBeat();
    }, 800);

    // End after 30 seconds
    setTimeout(() => {
      clearInterval(beatInterval);
      endGame();
    }, 30000);
  };

  const createBeat = () => {
    const newBeat = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 10,
    };
    setActiveBeats((prev) => [...prev, newBeat]);
    setTimeout(() => {
      setActiveBeats((prev) => prev.filter((b) => b.id !== newBeat.id));
    }, 1000);
  };

  const tapBeat = (id) => {
    setActiveBeats((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => s + 10);
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px",
        color: "white",
        minHeight: "85vh",
        background:
          "linear-gradient(135deg, rgba(40,40,90,0.6), rgba(70,40,100,0.6))",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>🎵 Beat Reflex Challenge</h2>

      {!gameActive && !gameOver && (
        <button
          onClick={startGame}
          style={{
            padding: "15px 30px",
            background: "var(--primary-gradient)",
            border: "none",
            borderRadius: "15px",
            fontWeight: "600",
            color: "white",
            cursor: "pointer",
          }}
        >
          ▶️ Start Game
        </button>
      )}

      {currentTrack && (
        <div style={{ margin: "30px 0" }}>
          <iframe
            src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
            width="100%"
            height="100"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          ></iframe>
          <h3>{currentTrack.title}</h3>
        </div>
      )}

      {gameActive && (
        <>
          <p style={{ fontSize: "1.3rem" }}>Score: {score}</p>

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "400px",
              marginTop: "30px",
              borderRadius: "15px",
              background: "rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            {activeBeats.map((beat) => (
              <motion.div
                key={beat.id}
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 0], opacity: [1, 0.7, 0] }}
                transition={{ duration: 1 }}
                onClick={() => tapBeat(beat.id)}
                style={{
                  position: "absolute",
                  left: `${beat.x}%`,
                  top: `${beat.y}%`,
                  width: "50px",
                  height: "50px",
                  background:
                    "radial-gradient(circle at center, #ff6b95, #a855f7)",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ fontSize: "1.5rem" }}>🎯 Final Score: {score}</h3>
          <p>
            {score > 150
              ? "🔥 Excellent reflexes!"
              : score > 80
              ? "🎶 Nice rhythm!"
              : "😅 You missed a few beats, try again!"}
          </p>
          <button
            onClick={startGame}
            style={{
              marginTop: "20px",
              padding: "12px 25px",
              background: "var(--accent-gradient)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🔁 Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicReflexGame;
