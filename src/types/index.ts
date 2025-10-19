export interface Dish {
  name: string;
  name_en: string;
  img: string;
}

export interface MarkerPosition {
  x: number;
  y: number;
}

export interface GeminiPayload {
  contents: {
    parts: {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }[];
  }[];
  generationConfig: {
    responseModalities: string[];
  };
}

export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }[];
    };
  }[];
  error?: {
    message: string;
  };
}
