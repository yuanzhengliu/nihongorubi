import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    Kuroshiro: any;
    kuromoji: any;
    KuromojiAnalyzer: any;
  }
}

type KuroshiroInstance = any;

function App() {
  const [text, setText] = useState('日本語の文章をここに入力してください。\n吾輩は猫である。名前はまだ無い。');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('初期化中...');
  const kuroshiroRef = useRef<KuroshiroInstance | null>(null);

  useEffect(() => {
    const initKuroshiro = async () => {
      try {
        setStatus('インスタンスを作成しています...');
        const kuroshiro = new window.Kuroshiro.default();
        kuroshiroRef.current = kuroshiro;

        // The analyzer constructor might also be on the .default property
        const analyzer = new window.KuromojiAnalyzer({
          dictPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/',
        });
        
        setStatus('辞書を読み込んでいます...');
        await kuroshiro.init(analyzer);
        
        setStatus('準備完了');
      } catch (err) {
        console.error('Initialization failed:', err);
        setStatus('エラー: 初期化に失敗しました。コンソールを確認してください。');
      }
    };

    // Wait for all three libraries to be loaded from the CDN
    const checkLibsAndInit = () => {
      if (window.Kuroshiro && window.kuromoji && window.KuromojiAnalyzer) {
        initKuroshiro();
      } else {
        setTimeout(checkLibsAndInit, 100);
      }
    };
    
    checkLibsAndInit();

  }, []);

  const handleConvert = async () => {
    const kuroshiro = kuroshiroRef.current;
    if (!kuroshiro || status !== '準備完了') return;

    try {
      const converted = await kuroshiro.convert(text, {
        mode: 'furigana',
        to: 'hiragana',
      });
      setResult(converted);
    } catch (err) {
      console.error('Conversion failed:', err);
      setResult('変換中にエラーが発生しました。');
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
        <button onClick={handleConvert} disabled={status !== '準備完了'}>
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
