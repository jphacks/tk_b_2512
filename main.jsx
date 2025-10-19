import React, { useState, useCallback, useEffect, useRef } from 'react';

// =================================================================================
// スタイル定義
// =================================================================================
/**
 * アプリケーション全体で使用するカスタムスタイル。
 * Reactコンポーネントがマウントされた際に<head>タグに挿入されます。
 * 元のHTMLの<style>タグの内容をここに集約しています。
 */
const GlobalStyles = () => {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      body {
        font-family: 'Noto Sans JP', sans-serif;
        background-color: #FDFBF8;
      }
      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #8C5E4A;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .image-container-dimmed::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        transition: opacity 0.3s;
        pointer-events: none;
      }
      .recommendation-card {
        transition: all 0.2s ease-in-out;
        border: 2px solid transparent;
      }
      .recommendation-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
      }
      .recommendation-card-selected {
        border-color: #8C5E4A;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        opacity: 1 !important;
      }
      /* 横スクロールバーのスタイル */
      .recommendations-scrollbar::-webkit-scrollbar { height: 8px; }
      .recommendations-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
      .recommendations-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
      .recommendations-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
    `;
    document.head.appendChild(styleElement);

    // クリーンアップ関数
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []); // 空の依存配列で、コンポーネントのマウント時に一度だけ実行

  return null; // このコンポーネントはUIを描画しない
};


// =================================================================================
// API通信ユーティリティ
// =================================================================================

/**
 * リトライ機能付きのfetchリクエストを送信する関数。
 * サーバーエラーやレート制限時に自動で再試行します。
 * @param {string} url - リクエスト先のURL
 * @param {object} options - fetchのオプション
 * @param {number} retries - 最大リトライ回数
 * @param {number} delay - リトライ間隔（ミリ秒）
 * @returns {Promise<Response>} fetchのレスポンス
 */
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // サーバーエラー(5xx)やレートリミット(429)でない場合はリトライせずに即時返す
            if (response.status < 500 && response.status !== 429) {
                return response;
            }
            // 最後のリトライでも失敗した場合は、そのレスポンスを返す
            if (i === retries - 1) return response;
        } catch (error) {
            // 最後のリトライでネットワークエラーなどが発生した場合は、エラーをスローする
            if (i === retries - 1) throw error;
        }
        // 指数関数的バックオフで待機
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
    throw new Error("Max retries reached");
};


// =================================================================================
// UIコンポーネント
// =================================================================================

/**
 * ヘッダーコンポーネント
 * @returns {React.ReactElement}
 */
const Header = () => (
    <header className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#8C5E4A]">ozendate</h1>
        <p className="text-gray-600 mt-2">AIテーブルコーディネートをもっと楽しく！</p>
    </header>
);

/**
 * ステップ1: 画像アップロードセクション
 * @param {{onImageUpload: (file: File) => void}} props
 * @returns {React.ReactElement}
 */
const UploadSection = ({ onImageUpload }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => fileInputRef.current?.click();
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    return (
        <section className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 cursor-pointer hover:bg-gray-50 transition" onClick={handleDivClick}>
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="mt-4 font-semibold text-gray-700">テーブルの写真をアップロード</p>
                <p className="mt-1 text-sm text-gray-500">クリックしてファイルを選択</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </section>
    );
};

/**
 * ステップ2: 編集セクション
 * @param {{
 * originalImageSource: string;
 * onImageClick: (coords: {x: number, y: number}) => void;
 * placementCoordinates: {x: number, y: number} | null;
 * isRecommendationLoading: boolean;
 * recommendations: Array<{name_ja: string, name_en: string}>;
 * onDishSelect: (dish: {name_ja: string, name_en: string}) => void;
 * isSelectionLocked: boolean;
 * selectedDish: {name_ja: string, name_en: string} | null;
 * }} props
 * @returns {React.ReactElement}
 */
const EditorSection = ({
    originalImageSource,
    onImageClick,
    placementCoordinates,
    isRecommendationLoading,
    recommendations,
    onDishSelect,
    isSelectionLocked,
    selectedDish
}) => {
    const imageContainerRef = useRef(null);

    const handleImageContainerClick = (event) => {
        // 画像へのクリックは、場所が未指定の場合のみ有効
        if (placementCoordinates) return;

        const container = imageContainerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            onImageClick({ x, y });
        }
    };

    const getInstructionText = () => {
        if (!placementCoordinates) return '1. 新しい食器を置きたい場所をクリックしてください。';
        if (isRecommendationLoading) return 'AIがあなたにおすすめの食器を考えています...';
        if (recommendations.length > 0) return '2. AIの提案から追加したい食器を選んでください。';
        return '';
    };

    return (
        <section>
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-center mb-4 text-sm font-medium">
                <p>{getInstructionText()}</p>
            </div>

            <div
                ref={imageContainerRef}
                onClick={handleImageContainerClick}
                className={`relative rounded-lg overflow-hidden shadow-md mx-auto max-w-2xl ${!placementCoordinates ? 'cursor-crosshair' : ''} ${selectedDish ? 'image-container-dimmed' : ''}`}
            >
                <img src={originalImageSource} alt="アップロードされたテーブル" className="w-full h-auto" />
                {placementCoordinates && (
                    <div
                        className="absolute"
                        style={{
                            left: `${placementCoordinates.x - 15}px`,
                            top: `${placementCoordinates.y - 15}px`,
                            width: '30px',
                            height: '30px',
                            border: '3px solid #8C5E4A',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(140, 94, 74, 0.3)',
                            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>

            {(isRecommendationLoading || recommendations.length > 0) && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3 text-center text-gray-700">AIのおすすめ</h2>
                    <div className="flex space-x-4 overflow-x-auto pb-4 recommendations-scrollbar">
                        {isRecommendationLoading ? (
                            <div className="w-full flex justify-center py-8"><div className="loader"></div></div>
                        ) : (
                            recommendations.map((dish) => (
                                <div
                                    key={dish.name_en}
                                    className={`recommendation-card w-40 flex-shrink-0 bg-white p-3 rounded-xl shadow-md border ${isSelectionLocked ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} ${selectedDish?.name_en === dish.name_en ? 'recommendation-card-selected' : ''}`}
                                    onClick={() => !isSelectionLocked && onDishSelect(dish)}
                                >
                                    <img src={`https://placehold.co/200x200/EAE5DB/333333?text=${encodeURIComponent(dish.name_ja)}`} alt={dish.name_ja} className="w-full h-24 object-cover rounded-md mx-auto" />
                                    <p className="text-xs font-semibold mt-2 text-center">{dish.name_ja}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

/**
 * ステップ3: ローディングセクション
 * @param {{text: string}} props
 * @returns {React.ReactElement}
 */
const LoadingSection = ({ text }) => (
    <section className="text-center py-12">
        <div className="loader mx-auto"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600">{text}</p>
        <p className="text-sm text-gray-500">素晴らしいコーディネートを準備しています</p>
    </section>
);

/**
 * ステップ4: 結果表示セクション
 * @param {{generatedImageSource: string; onReset: () => void}} props
 * @returns {React.ReactElement}
 */
const ResultSection = ({ generatedImageSource, onReset }) => (
    <section className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">✨ 完成です！ ✨</h2>
        <img src={generatedImageSource} alt="生成されたコーディネート" className="rounded-lg shadow-lg w-full max-w-2xl mx-auto" />
        <button onClick={onReset} className="mt-6 bg-[#8C5E4A] hover:bg-[#754f3d] text-white font-bold py-2 px-6 rounded-full transition">
            もう一度試す
        </button>
    </section>
);

/**
 * エラーモーダル
 * @param {{message: string; onClose: () => void}} props
 * @returns {React.ReactElement}
 */
const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm">
            <h3 className="text-lg font-bold text-red-600">エラーが発生しました</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <button onClick={onClose} className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                閉じる
            </button>
        </div>
    </div>
);

// =================================================================================
// メインアプリケーションコンポーネント
// =================================================================================

/**
 * アプリケーションのメインコンポーネント。
 * 全体の状態管理とビジネスロジックを担当します。
 */
export default function App() {
    // --- 状態管理 (State) ---
    // アプリケーションの現在の表示状態を管理 (UPLOAD, EDIT, LOADING, RESULT)
    const [applicationStatus, setApplicationStatus] = useState('UPLOAD');
    
    // アップロードされた元の画像(Base64形式)
    const [originalImageSource, setOriginalImageSource] = useState(null);
    
    // ユーザーがクリックした食器の配置座標
    const [placementCoordinates, setPlacementCoordinates] = useState(null);
    
    // AIから提案された食器のリスト
    const [recommendations, setRecommendations] = useState([]);
    
    // ユーザーが選択した食器
    const [selectedDish, setSelectedDish] = useState(null);
    
    // AIによって生成された最終的な画像(Base64形式)
    const [generatedImageSource, setGeneratedImageSource] = useState(null);
    
    // API通信中のローディング状態
    const [isLoading, setIsLoading] = useState(false);
    
    // ローディング中に表示するテキスト
    const [loadingText, setLoadingText] = useState('');
    
    // エラーメッセージ
    const [errorMessage, setErrorMessage] = useState('');

    // --- APIキー (環境変数などから取得するのが望ましい) ---
    const API_KEY = ""; // NOTE: 実行には有効なAPIキーが必要です

    // --- イベントハンドラ ---

    /**
     * 画像ファイルがアップロードされたときの処理
     * @param {File} file - アップロードされたファイル
     */
    const handleImageUpload = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            setOriginalImageSource(event.target.result);
            setApplicationStatus('EDIT');
        };
        reader.readAsDataURL(file);
    }, []);

    /**
     * 編集画面で画像がクリックされたときの処理
     * @param {{x: number, y: number}} coordinates - クリックされた座標
     */
    const handleImageClick = useCallback(async (coordinates) => {
        setPlacementCoordinates(coordinates);
        setRecommendations([]); // おすすめリストをリセット
        setIsLoading(true);

        const prompt = `Analyze the attached image of a table setting. A user wants to place a new item. Suggest 5 diverse types of tableware (like 'a small blue ceramic bowl', 'a rustic wooden plate', 'a modern glass cup') that would complement the existing items in terms of style, color, and occasion. Provide the response as a valid JSON array of objects, where each object has a 'name_ja' (Japanese name) and a 'name_en' (English name for the image generation prompt).`;
        const base64Data = originalImageSource.split(',')[1];
        
        const payload = {
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: { "name_ja": { "type": "STRING" }, "name_en": { "type": "STRING" } },
                        required: ["name_ja", "name_en"]
                    }
                }
            }
        };

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API error (${response.status}): ${await response.text()}`);
            
            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) throw new Error("APIから有効なJSONテキストが返されませんでした。");

            setRecommendations(JSON.parse(jsonText));
        } catch (error) {
            console.error("Failed to get AI recommendations:", error);
            setErrorMessage(`AIによる提案の取得に失敗しました。${error.message}`);
            // エラーが発生したらクリック前の状態に戻す
            setPlacementCoordinates(null);
        } finally {
            setIsLoading(false);
        }
    }, [originalImageSource, API_KEY]);

    /**
     * おすすめの食器が選択されたときの処理
     * @param {{name_ja: string, name_en: string}} dish - 選択された食器
     */
    const handleDishSelect = useCallback(async (dish) => {
        setSelectedDish(dish);
        setApplicationStatus('LOADING');
        setLoadingText('AIが画像を生成中です...');
        
        // 選択した食器の視覚フィードバックを見せるため少し待つ
        await new Promise(resolve => setTimeout(resolve, 500));

        const prompt = `Photo of a table setting. Place ${dish.name_en} on the table. The desired location for the new item is at the center of the provided mask area. The new item should blend in naturally with the existing lighting, shadows, and perspective. Maintain the original image's style and quality. Do not change anything else in the image.`;
        const base64Data = originalImageSource.split(',')[1];
        
        const payload = {
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
            generationConfig: { responseModalities: ['IMAGE'] }
        };

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API error (${response.status}): ${await response.text()}`);

            const result = await response.json();
            const generatedImageData = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            
            if (generatedImageData) {
                const mimeType = result.candidates[0].content.parts.find(p => p.inlineData).inlineData.mimeType;
                setGeneratedImageSource(`data:${mimeType};base64,${generatedImageData}`);
                setApplicationStatus('RESULT');
            } else {
                console.error('API Response:', JSON.stringify(result, null, 2));
                throw new Error("生成された画像データがAPIレスポンスに含まれていませんでした。");
            }

        } catch (error) {
            console.error("Image generation failed:", error);
            setErrorMessage(`画像の生成に失敗しました。詳細: ${error.message}`);
            // 失敗した場合は編集画面に戻る
            setApplicationStatus('EDIT');
            setSelectedDish(null); // 選択を解除
        }
    }, [originalImageSource, API_KEY]);

    /**
     * アプリケーションを初期状態にリセットする処理
     */
    const handleReset = useCallback(() => {
        setApplicationStatus('UPLOAD');
        setOriginalImageSource(null);
        setPlacementCoordinates(null);
        setRecommendations([]);
        setSelectedDish(null);
        setGeneratedImageSource(null);
        setIsLoading(false);
        setLoadingText('');
        setErrorMessage('');
    }, []);

    /**
     * エラーモーダルを閉じる処理
     */
    const closeErrorModal = useCallback(() => setErrorMessage(''), []);

    // --- レンダリング ---

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <Header />

                    {applicationStatus === 'UPLOAD' && <UploadSection onImageUpload={handleImageUpload} />}
                    
                    {applicationStatus === 'EDIT' && originalImageSource && (
                        <EditorSection
                            originalImageSource={originalImageSource}
                            onImageClick={handleImageClick}
                            placementCoordinates={placementCoordinates}
                            isRecommendationLoading={isLoading && recommendations.length === 0}
                            recommendations={recommendations}
                            onDishSelect={handleDishSelect}
                            isSelectionLocked={!!selectedDish}
                            selectedDish={selectedDish}
                        />
                    )}
                    
                    {applicationStatus === 'LOADING' && <LoadingSection text={loadingText} />}
                    
                    {applicationStatus === 'RESULT' && generatedImageSource && (
                        <ResultSection generatedImageSource={generatedImageSource} onReset={handleReset} />
                    )}

                </div>
            </div>
            {errorMessage && <ErrorModal message={errorMessage} onClose={closeErrorModal} />}
        </>
    );
}

