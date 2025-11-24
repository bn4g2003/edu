import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  try {
    if (!apiKey) {
      return "Hệ thống AI chưa được cấu hình API Key. Vui lòng kiểm tra cài đặt.";
    }

    // Convert history to format compatible with Gemini if needed, 
    // but here we will just use a simple generateContent with context for simplicity in this demo widget
    // or use a proper chat session. Let's use a chat session for better context.
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Bạn là 'EduBot', một trợ lý tư vấn giáo dục ảo chuyên nghiệp của nền tảng EduPro.
        Nhiệm vụ của bạn là tư vấn khóa học, giải đáp thắc mắc về lộ trình học tập và khuyến khích người dùng đăng ký.
        Phong cách: Thân thiện, chuyên nghiệp, ngắn gọn và hữu ích.
        Nếu người dùng hỏi về giá, hãy gợi ý họ xem phần Bảng Giá (Pricing).
        Hãy trả lời bằng Tiếng Việt.`,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Xin lỗi, tôi không thể trả lời ngay lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với trợ lý ảo. Vui lòng thử lại sau.";
  }
};