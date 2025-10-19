import { useRef, useState } from 'react';
import type { Dish, MarkerPosition } from '../types';
import { RECOMMENDED_DISHES } from '../constants/dishes';

interface EditorSectionProps {
  imageSrc: string;
  onDishSelect: (dish: Dish, position: MarkerPosition) => void;
}

export default function EditorSection({
  imageSrc,
  onDishSelect,
}: EditorSectionProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [markerPosition, setMarkerPosition] = useState<MarkerPosition | null>(
    null,
  );
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedDishIndex, setSelectedDishIndex] = useState<number | null>(
    null,
  );

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (showRecommendations) return;

    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMarkerPosition({ x, y });
    setShowRecommendations(true);
  };

  const handleDishSelect = (dish: Dish, index: number) => {
    if (!markerPosition) return;

    setSelectedDishIndex(index);
    setTimeout(() => {
      onDishSelect(dish, markerPosition);
    }, 500);
  };

  const instructionText = showRecommendations
    ? '2. 追加したい食器を選んでください。'
    : '1. 新しい食器を置きたい場所をクリックしてください。';

  return (
    <section>
      <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 p-3 rounded-lg text-center mb-4 text-sm font-medium">
        <p>{instructionText}</p>
      </div>

      <button
        type="button"
        ref={imageContainerRef as unknown as React.RefObject<HTMLButtonElement>}
        className={`relative rounded-lg overflow-hidden cursor-crosshair shadow-md mx-auto max-w-2xl w-full border-0 p-0 ${
          selectedDishIndex !== null ? 'image-container-dimmed' : ''
        }`}
        onClick={handleImageClick as unknown as React.MouseEventHandler<HTMLButtonElement>}
      >
        <img src={imageSrc} alt="Uploaded table" className="w-full h-auto" />
        {markerPosition && (
          <div
            className="absolute w-[30px] h-[30px] border-[3px] border-indigo-500 rounded-full bg-indigo-500/30 pointer-events-none"
            style={{
              left: `${markerPosition.x - 15}px`,
              top: `${markerPosition.y - 15}px`,
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}
          />
        )}
      </button>

      {showRecommendations && (
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {RECOMMENDED_DISHES.map((dish, index) => (
              <button
                type="button"
                key={dish.name_en}
                className={`recommendation-card bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center cursor-pointer ${
                  selectedDishIndex !== null && selectedDishIndex !== index
                    ? 'opacity-50 pointer-events-none'
                    : ''
                } ${
                  selectedDishIndex === index
                    ? 'border-2 border-indigo-500'
                    : ''
                }`}
                onClick={() => handleDishSelect(dish, index)}
              >
                <img
                  src={dish.img}
                  alt={dish.name}
                  className="w-full h-24 object-cover rounded-md mx-auto"
                />
                <p className="text-xs font-semibold mt-2">{dish.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
