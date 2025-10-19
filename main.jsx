import React, { useState, useCallback, useEffect, useRef } from 'react';

// =================================================================================
// スタイル定義
// =================================================================================
/**
 * アプリケーション全体で使用するカスタムスタイル。
 * Reactコンポーネントがマウントされた際に<head>タグに挿入されます。
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
      .recommendations-scrollbar::-webkit-scrollbar { height: 8px; }
      .recommendations-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
      .recommendations-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
      .recommendations-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
    `;
    document.head.appendChild(styleElement);
    return () => { document.head.removeChild(styleElement); };
  }, []);
  return null;
};

// =================================================================================
// API通信・画像処理ユーティリティ
// =================================================================================

/**
 * リトライ機能付きのfetchリクエストを送信する関数。
 */
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status < 500 && response.status !== 429) return response;
            if (i === retries - 1) return response;
        } catch (error) {
            if (i === retries - 1) throw error;
        }
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
    throw new Error("Max retries reached");
};

/**
 * 元画像と選択された食器画像を合成する関数。
 */
const createCompositeImage = (originalImageBase64, selectedDish, placementCoordinates, displayedImageElement) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const baseImage = new Image();
        baseImage.src = originalImageBase64;
        baseImage.onload = () => {
            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;
            ctx.drawImage(baseImage, 0, 0);

            const itemImage = new Image();
            itemImage.crossOrigin = "anonymous";
            itemImage.src = selectedDish.image;
            itemImage.onload = () => {
                const displayedImgRect = displayedImageElement.getBoundingClientRect();
                const scaleX = baseImage.naturalWidth / displayedImgRect.width;
                const scaleY = baseImage.naturalHeight / displayedImgRect.height;
                const drawX = placementCoordinates.x * scaleX;
                const drawY = placementCoordinates.y * scaleY;
                const itemWidth = baseImage.naturalWidth * 0.15;
                const itemHeight = itemImage.height * (itemWidth / itemImage.width);
                ctx.drawImage(itemImage, drawX - itemWidth / 2, drawY - itemHeight / 2, itemWidth, itemHeight);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            itemImage.onerror = () => reject(new Error('選択された食器画像の読み込みに失敗しました。'));
        };
        baseImage.onerror = () => reject(new Error('ベース画像の読み込みに失敗しました。'));
    });
};

/**
 * AIを使用して、提供された食器リストから画像に最適なものを推薦する関数。
 */
const getAIRecommendations = async (imageBase64, allDishes, apiKey) => {
    const prompt = `
        You are an expert table coordinator AI. Based on the provided image of a user's table setting, please select the 4 most suitable dishes from the following JSON list.
        Analyze the style, color palette, materials, and overall mood of the user's image to make your selections.
        Available dishes list:
        ${JSON.stringify(allDishes, null, 2)}
        Your response MUST be a valid JSON array containing exactly 4 dish objects, copied precisely from the provided list. Do not include any other text or explanations.
    `;
    const base64Data = imageBase64.split(',')[1];
    const payload = {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
        generationConfig: { responseMimeType: "application/json" }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`AI APIエラー (${response.status}): ${await response.text()}`);
    }
    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
        console.error('AI Response:', JSON.stringify(result, null, 2));
        throw new Error("AIからの応答が空でした。");
    }
    try {
        return JSON.parse(responseText);
    } catch (parseError) {
        console.error("Failed to parse AI response:", responseText);
        throw new Error(`AIの応答を解析できませんでした。 ${parseError.message}`);
    }
};

// =================================================================================
// UIコンポーネント
// =================================================================================

const Header = () => (
    <header className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#8C5E4A]">ozendate</h1>
        <p className="text-gray-600 mt-2">AIテーブルコーディネートをもっと楽しく！</p>
    </header>
);

const UploadSection = ({ onImageUpload }) => {
    const fileInputRef = useRef(null);
    return (
        <section className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 cursor-pointer hover:bg-gray-50 transition" onClick={() => fileInputRef.current?.click()}>
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="mt-4 font-semibold text-gray-700">テーブルの写真をアップロード</p>
                <p className="mt-1 text-sm text-gray-500">クリックしてファイルを選択</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} />
        </section>
    );
};

const EditorSection = ({ originalImageSource, onImageClick, placementCoordinates, isRecommendationLoading, recommendations, onDishSelect, isSelectionLocked, selectedDish, imageRef }) => {
    const getInstructionText = () => {
        if (!placementCoordinates) return '1. 新しい食器を置きたい場所をクリックしてください。';
        if (isRecommendationLoading) return 'AIがあなたのテーブルに合う食器を分析中です...';
        if (recommendations.length > 0) return '2. 提案から追加したい食器を選んでください。';
        return '';
    };

    return (
        <section>
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-center mb-4 text-sm font-medium">
                <p>{getInstructionText()}</p>
            </div>
            <div onClick={(e) => { if (!placementCoordinates) { const rect = e.currentTarget.getBoundingClientRect(); onImageClick({ x: e.clientX - rect.left, y: e.clientY - rect.top }); } }} className={`relative rounded-lg overflow-hidden shadow-md mx-auto max-w-2xl ${!placementCoordinates ? 'cursor-crosshair' : ''} ${selectedDish ? 'image-container-dimmed' : ''}`}>
                <img ref={imageRef} src={originalImageSource} alt="アップロードされたテーブル" className="w-full h-auto" />
                {placementCoordinates && <div className="absolute" style={{ left: `${placementCoordinates.x - 15}px`, top: `${placementCoordinates.y - 15}px`, width: '30px', height: '30px', border: '3px solid #8C5E4A', borderRadius: '50%', backgroundColor: 'rgba(140, 94, 74, 0.3)', boxShadow: '0 0 10px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />}
            </div>
            {(isRecommendationLoading || recommendations.length > 0) && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3 text-center text-gray-700">AIが選んだおすすめの食器</h2>
                    <div className="flex space-x-4 overflow-x-auto pb-4 recommendations-scrollbar">
                        {isRecommendationLoading ? <div className="w-full flex justify-center py-8"><div className="loader"></div></div> :
                            recommendations.map((dish) => (
                                <div key={dish.image} className={`recommendation-card w-40 flex-shrink-0 bg-white p-3 rounded-xl shadow-md border ${isSelectionLocked ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} ${selectedDish?.image === dish.image ? 'recommendation-card-selected' : ''}`} onClick={() => !isSelectionLocked && onDishSelect(dish)}>
                                    <img src={dish.image} alt={dish.text} className="w-full h-24 object-cover rounded-md mx-auto" crossOrigin="anonymous" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/150x100/FDFBF8/8C5E4A?text=No+Image'; }} />
                                    <p className="text-xs font-semibold mt-2 text-center">{dish.text}</p>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </section>
    );
};

const LoadingSection = ({ text }) => (
    <section className="text-center py-12">
        <div className="loader mx-auto"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600">{text}</p>
        <p className="text-sm text-gray-500">素晴らしいコーディネートを準備しています</p>
    </section>
);

const ResultSection = ({ generatedImageSource, onReset }) => (
    <section className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">✨ 完成です！ ✨</h2>
        <img src={generatedImageSource} alt="生成されたコーディネート" className="rounded-lg shadow-lg w-full max-w-2xl mx-auto" />
        <button onClick={onReset} className="mt-6 bg-[#8C5E4A] hover:bg-[#754f3d] text-white font-bold py-2 px-6 rounded-full transition">もう一度試す</button>
    </section>
);

const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm">
            <h3 className="text-lg font-bold text-red-600">エラーが発生しました</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <button onClick={onClose} className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">閉じる</button>
        </div>
    </div>
);

// =================================================================================
// メインアプリケーションコンポーネント
// =================================================================================

export default function App() {
    const [applicationStatus, setApplicationStatus] = useState('UPLOAD');
    const [originalImageSource, setOriginalImageSource] = useState(null);
    const [placementCoordinates, setPlacementCoordinates] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [selectedDish, setSelectedDish] = useState(null);
    const [generatedImageSource, setGeneratedImageSource] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const uploadedImageRef = useRef(null);
    const API_KEY = "";

    const handleImageUpload = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            setOriginalImageSource(event.target.result);
            setApplicationStatus('EDIT');
        };
        reader.readAsDataURL(file);
    }, []);

    const handleImageClick = useCallback(async (coordinates) => {
        setPlacementCoordinates(coordinates);
        setIsLoading(true);
        try {
            const jsonUrl = 'https://raw.githubusercontent.com/jphacks/tk_b_2512/main/json/consumer.json';
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error(`食器リストの取得に失敗しました: ${response.statusText}`);
            const allDishes = await response.json();
            const recommendedDishes = await getAIRecommendations(originalImageSource, allDishes, API_KEY);
            setRecommendations(recommendedDishes);
        } catch (error) {
            console.error("Failed to get dish recommendations:", error);
            setErrorMessage(`食器のおすすめの取得に失敗しました。${error.message}`);
            setPlacementCoordinates(null);
        } finally {
            setIsLoading(false);
        }
    }, [originalImageSource, API_KEY]);

    const handleDishSelect = useCallback(async (dish) => {
        setSelectedDish(dish);
        setApplicationStatus('LOADING');
        setLoadingText('画像を合成しています...');
        try {
            const compositeImageBase64 = await createCompositeImage(originalImageSource, dish, placementCoordinates, uploadedImageRef.current);
            setLoadingText('AIが画像を調整中です...');
            const prompt = `This is a composite image. Please blend the newly added tableware item ('${dish.text}') into the table setting naturally. Adjust lighting, shadows, reflections, and perspective to make it look realistic and seamless. Do not change any other part of the image.`;
            const base64Data = compositeImageBase64.split(',')[1];
            const payload = {
                contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
                generationConfig: { responseModalities: ['IMAGE'] }
            };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
            const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error (${response.status}): ${await response.text()}`);
            const result = await response.json();
            const generatedImageData = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (generatedImageData) {
                const mimeType = result.candidates[0].content.parts.find(p => p.inlineData).inlineData.mimeType;
                setGeneratedImageSource(`data:${mimeType};base64,${generatedImageData}`);
                setApplicationStatus('RESULT');
            } else {
                throw new Error("生成された画像データがAPIレスポンスに含まれていませんでした。");
            }
        } catch (error) {
            console.error("Image generation failed:", error);
            setErrorMessage(`画像の生成に失敗しました。詳細: ${error.message}`);
            setApplicationStatus('EDIT');
            setSelectedDish(null);
        }
    }, [originalImageSource, placementCoordinates, API_KEY]);

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
                            isRecommendationLoading={isLoading}
                            recommendations={recommendations}
                            onDishSelect={handleDishSelect}
                            isSelectionLocked={!!selectedDish}
                            selectedDish={selectedDish}
                            imageRef={uploadedImageRef}
                        />
                    )}
                    {applicationStatus === 'LOADING' && <LoadingSection text={loadingText} />}
                    {applicationStatus === 'RESULT' && generatedImageSource && <ResultSection generatedImageSource={generatedImageSource} onReset={handleReset} />}
                </div>
            </div>
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />}
        </>
    );
}

