import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
} from '@mui/icons-material';
import { useToastStore } from '../../store/toastStore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  onClose?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là AI Assistant của hệ thống. Tôi có thể giúp bạn:\n- Xem báo cáo doanh thu\n- Kiểm tra tồn kho\n- Đề xuất nhập hàng\n- Phân tích xu hướng bán hàng\n\nBạn cần hỗ trợ gì?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToastStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response - Thay thế bằng API call thực tế
    setTimeout(() => {
      const botResponse = generateBotResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('doanh thu') || lowerInput.includes('revenue')) {
      return 'Theo dữ liệu hiện tại:\n- Doanh thu hôm nay: 125.000.000 VNĐ\n- Doanh thu tháng này: 3.750.000.000 VNĐ\n- Tăng trưởng: +15.5% so với tháng trước\n\nBạn có muốn xem báo cáo chi tiết không?';
    }

    if (lowerInput.includes('tồn kho') || lowerInput.includes('inventory')) {
      return 'Tình trạng tồn kho:\n- Tổng sản phẩm: 450\n- Sản phẩm sắp hết: 12\n- Sản phẩm cần nhập: 5\n\nCó 3 cảnh báo khẩn cấp cần xử lý. Bạn muốn xem chi tiết?';
    }

    if (lowerInput.includes('nhập hàng') || lowerInput.includes('import')) {
      return 'Đề xuất nhập hàng:\n1. Coca Cola 330ml - Đề xuất: 200 đơn vị\n2. Pepsi 330ml - Đề xuất: 100 đơn vị (khẩn cấp)\n3. Bánh mì thịt nướng - Đề xuất: 50 đơn vị\n\nĐộ tin cậy dự đoán: 85-90%';
    }

    if (lowerInput.includes('xu hướng') || lowerInput.includes('trend')) {
      return 'Phân tích xu hướng bán hàng:\n- Sản phẩm bán chạy: Coca Cola 330ml (+20%)\n- Sản phẩm bán chậm: Bánh mì thịt nướng (-10%)\n- Thời gian cao điểm: 10h-12h, 17h-19h\n\nĐề xuất: Tăng tồn kho cho Coca Cola, giảm giá cho Bánh mì.';
    }

    if (lowerInput.includes('cảnh báo') || lowerInput.includes('alert')) {
      return 'Cảnh báo hiện tại:\n⚠️ URGENT: Pepsi 330ml sắp hết hàng (25/50)\n⚠️ HIGH: Doanh thu giảm 15% so với cùng kỳ\n⚠️ MEDIUM: 3 sản phẩm bán chậm\n\nVui lòng xử lý sớm!';
    }

    if (lowerInput.includes('xin chào') || lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Xin chào! Tôi có thể giúp bạn:\n- Xem báo cáo và thống kê\n- Kiểm tra tồn kho\n- Đề xuất nhập hàng\n- Phân tích xu hướng\n- Xem cảnh báo\n\nBạn muốn biết gì?';
    }

    return 'Tôi hiểu bạn đang hỏi về: "' + userInput + '".\n\nTôi có thể giúp bạn với:\n- Báo cáo doanh thu\n- Quản lý tồn kho\n- Đề xuất từ AI\n- Phân tích xu hướng\n\nBạn muốn hỏi cụ thể về điều gì?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsMinimized(false)}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 56,
            height: 56,
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: 3,
          }}
        >
          <BotIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Fade in>
      <Card
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 400,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: 6,
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Assistant
            </Typography>
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(true)}
              sx={{ color: 'white' }}
            >
              <MinimizeIcon />
            </IconButton>
            {onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <CardContent
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {message.sender === 'bot' && (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <BotIcon fontSize="small" />
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '70%',
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Paper>
              {message.sender === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  U
                </Avatar>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <BotIcon fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 1.5 }}>
                <CircularProgress size={16} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
    </Fade>
  );
};
