import { useState, useEffect, useRef } from 'react';

function App() {
  const [text, setText] = useState('日本語の文章をここに入力してください。\n吾輩は猫である。名前はまだ無い。');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('初期化中...');
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Vite-specific syntax for creating a worker
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    // Listen for messages from the worker
    worker.onmessage = (event) => {
      const { type, status: newStatus, payload } = event.data;

      if (newStatus) {
        setStatus(newStatus);
      }
      if (type === 'ready') {
        setIsReady(true);
      }
      if (type === 'converted') {
        setResult(payload);
      }
      if (type === 'error') {
        console.error('Error from worker:', payload);
        setStatus(`エラー: ${payload}`);
      }
    };

    // Start the initialization process in the worker
    worker.postMessage({
      type: 'init',
      payload: {
        dictPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/',
      },
    });

    // Cleanup worker on component unmount
    return () => {
      worker.terminate();
    };
  }, []);

  const handleConvert = () => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({
      type: 'convert',
      payload: { text },
    });
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
        .then(() => alert('HTMLがクリップボードにコピーされました！'))
        .catch(() => alert('コピーに失敗しました。'));
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>日本語ルビ振りツール</h1>
        <p>テキストを入力して、HTML形式のルビ（ふりがな）を生成します。</p>
      </header>
      
      <div className="main-content">
        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ここに日本語のテキストを入力..."
        />
        <div 
          className="output-area"
          dangerouslySetInnerHTML={{ __html: result || 'ここに結果が表示されます' }} 
        />
      </div>

      <div className="controls">
        <button onClick={handleConvert} disabled={!isReady}>
          ルビを振る
        </button>
        <button onClick={handleCopy} disabled={!result}>
          HTMLをコピー
        </button>
      </div>

      <div className="status-indicator">
        {status}
      </div>
    </div>
  );
}

export default App;
