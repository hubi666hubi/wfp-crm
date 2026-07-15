import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add Canvas import and Ref
import_str = "import { startAgentBrokerListener } from './services/AgentBroker';"
new_import = "import { startAgentBrokerListener } from './services/AgentBroker';\nimport { useEffect, useRef } from 'react';"
content = content.replace(import_str, new_import)

# Insert Matrix Rain component before App function
matrix_rain_component = """
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444'; // Rose/Red matrix
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        // High opacity for text, but the canvas itself will be low opacity
        ctx.fillStyle = Math.random() > 0.9 ? '#f59e0b' : '#ef4444'; // Occasional amber glitch
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-screen" />;
};
"""

content = content.replace("export default function App() {", matrix_rain_component + "\nexport default function App() {")

# Insert MatrixRain component inside AppLayout but above Routes
return_str = "    <AppLayout user={user as User}>"
new_return = "    <AppLayout user={user as User}>\n      <MatrixRain />"
content = content.replace(return_str, new_return)

with open('src/App.tsx', 'w') as f:
    f.write(content)
