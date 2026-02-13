import { useState } from 'react';

// Store the Client ID provided by the user
const YAHOO_CLIENT_ID = 'dj0yJmk9dzZUMkZVSDJqblBUJmQ9WVdrOWJEQlZibE5VTXpRbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmeD0zYQ--';

/**
 * Parses the complex JSON response from the Yahoo API and converts it to an HTML string with <ruby> tags.
 * @param {any} apiResponse - The JSON object from the Yahoo API.
 * @returns {string} An HTML string with furigana.
 */
const parseYahooResponse = (apiResponse: any): string => {
  if (!apiResponse.result || !apiResponse.result.word) {
    return '';
  }

  let html = '';
  for (const word of apiResponse.result.word) {
    // If the word has subwords (due to compound nature), process them recursively
    if (word.subword) {
      for (const sub of word.subword) {
          if (sub.furigana) {
            html += `<ruby>${sub.surface}<rt>${sub.furigana}</rt></ruby>`;
          } else {
            html += sub.surface;
          }
      }
    } else {
      // Otherwise, process the word itself
      if (word.furigana) {
        html += `<ruby>${word.surface}<rt>${word.furigana}</rt></ruby>`;
      } else {
        html += word.surface;
      }
    }
  }
  return html;
};


function App() {
  const [text, setText] = useState('日本語の文章をここに入力してください。\n吾輩は猫である。名前はまだ無い。');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('準備完了');

  const handleConvert = async () => {
    if (!text.trim()) {
      setResult('テキストを入力してください。');
      return;
    }

    setStatus('変換中...');
    try {
      const response = await fetch('https://jlp.yahooapis.jp/FuriganaService/V2/furigana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Yahoo AppID: ${YAHOO_CLIENT_ID}`,
        },
        body: JSON.stringify({
          "id": new Date().getTime().toString(),
          "jsonrpc": "2.0",
          "method": "jlp.furiganaservice.furigana",
          "params": {
            "q": text,
            "grade": 1
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`APIからのエラー: ${data.error.message} (Code: ${data.error.code})`);
      }
      
      const htmlResult = parseYahooResponse(data);
      setResult(htmlResult);
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
