import { useState } from 'react';

function App() {
  const [text, setText] = useState('日本語の文章をここに入力してください。\n吾輩は猫である。名前はまだ無い。');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('準備完了'); // App is ready immediately

  const handleConvert = async () => {
    if (!text.trim()) {
      setResult('テキストを入力してください。');
      return;
    }

    setStatus('変換中...');
    try {
      const response = await fetch('https://api.furiousgana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ japanese: text }]),
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Assuming the response is an array and we need the first element's 'furigana' property
      if (data && data.length > 0 && data[0].furigana) {
        setResult(data[0].furigana);
      } else {
        // Fallback for unexpected API response structure
        // Sometimes the API might return a different structure with a 'sentence' property
        if (data && data.length > 0 && data[0].sentence) {
           setResult(data[0].sentence);
        } else {
           throw new Error('APIからのレスポンス形式が不正です。');
        }
      }
      setStatus('準備完了');
    } catch (err) {
      console.error('Conversion failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult(`変換中にエラーが発生しました: ${errorMessage}`);
      setStatus('エラー');
    }
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
        <button onClick={handleConvert} disabled={status === '変換中...'}>
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
