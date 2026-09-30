html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at top, #171f33, #050816 55%);
  font-family: Inter, 'Segoe UI', sans-serif;
  color: #edf3ff;
}

#app {
  width: 100vw;
  height: 100vh;
}

.canvas-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  top: 18px;
  left: 18px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.3);
  z-index: 10;
}

.hud h1 {
  margin: 0 0 6px;
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hud p {
  margin: 0;
  font-size: 12px;
  color: #cbd5e1;
}
