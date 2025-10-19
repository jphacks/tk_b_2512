import { useState } from "react";
import UploadSection from "./components/UploadSection";
import EditorSection from "./components/EditorSection";
import LoadingSection from "./components/LoadingSection";
import ResultSection from "./components/ResultSection";
import ErrorModal from "./components/ErrorModal";
import { generateImageWithGemini } from "./utils/geminiApi";
import type { Dish, MarkerPosition } from "./types";

type AppStep = "upload" | "editor" | "loading" | "result";

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("upload");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleImageUpload = (imageBase64: string) => {
    setUploadedImage(imageBase64);
    setCurrentStep("editor");
  };

  const handleDishSelect = async (dish: Dish, position: MarkerPosition) => {
    setCurrentStep("loading");

    try {
      // Get the image element dimensions
      const img = new Image();
      img.src = uploadedImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const percentX = (position.x / img.width) * 100;
      const percentY = (position.y / img.height) * 100;

      const generatedImage = await generateImageWithGemini(
        uploadedImage,
        dish.name_en,
        percentX,
        percentY,
      );

      setResultImage(generatedImage);
      setCurrentStep("result");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "画像の生成に失敗しました。";
      setErrorMessage(message);
      setIsErrorModalOpen(true);
      setCurrentStep("editor");
    }
  };

  const handleReset = () => {
    setUploadedImage("");
    setResultImage("");
    setCurrentStep("upload");
  };

  const handleErrorClose = () => {
    setIsErrorModalOpen(false);
    setErrorMessage("");
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            ozendate
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AIテーブルコーディネートをもっと楽しく!
          </p>
        </header>

        {currentStep === "upload" && (
          <UploadSection onImageUpload={handleImageUpload} />
        )}

        {currentStep === "editor" && (
          <EditorSection
            imageSrc={uploadedImage}
            onDishSelect={handleDishSelect}
          />
        )}

        {currentStep === "loading" && <LoadingSection />}

        {currentStep === "result" && (
          <ResultSection resultImageSrc={resultImage} onReset={handleReset} />
        )}

        <ErrorModal
          isOpen={isErrorModalOpen}
          message={errorMessage}
          onClose={handleErrorClose}
        />
      </div>
    </div>
  );
}

export default App;
