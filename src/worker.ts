/// <reference lib="webworker" />

// src/worker.ts

// Define types for the global objects that will be available after importing the scripts
declare global {
  interface Window {
    Kuroshiro: any;
    KuromojiAnalyzer: any;
  }
}

let kuroshiro: any = null;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    // Load external libraries
    importScripts(
      'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js',
      'https://cdn.jsdelivr.net/npm/kuroshiro@1.2.0/dist/kuroshiro.min.js',
      'https://cdn.jsdelivr.net/npm/kuroshiro-analyzer-kuromoji@1.1.0/dist/kuroshiro-analyzer-kuromoji.min.js'
    );

    try {
      postMessage({ status: 'インスタンスを作成しています...' });
      kuroshiro = new self.Kuroshiro.default();

      postMessage({ status: '辞書を読み込んでいます...' });
      await kuroshiro.init(new self.KuromojiAnalyzer({
        dictPath: payload.dictPath,
      }));
      
      postMessage({ status: '準備完了', type: 'ready' });
    } catch (err) {
      console.error('Worker initialization failed:', err);
      postMessage({ status: `エラー: 初期化に失敗しました。 ${err}`, type: 'error' });
    }
  }

  if (type === 'convert') {
    if (!kuroshiro) {
      postMessage({ type: 'error', payload: 'Kuroshiro not initialized.' });
      return;
    }
    try {
      const result = await kuroshiro.convert(payload.text, {
        mode: 'furigana',
        to: 'hiragana',
      });
      postMessage({ type: 'converted', payload: result });
    } catch (err) {
      console.error('Worker conversion failed:', err);
      postMessage({ type: 'error', payload: '変換中にエラーが発生しました。' });
    }
  }
};
