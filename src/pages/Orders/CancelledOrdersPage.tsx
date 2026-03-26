import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { 
  Engineering as EngineeringIcon, 
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const CancelledOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 64px)', // Trừ đi chiều cao của Header
      bgcolor: '#f4f6f8', 
      p: 3 
    }}>
      <Paper sx={{ 
        p: 6, 
        borderRadius: 4, 
        textAlign: 'center', 
        maxWidth: 500, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        borderTop: '6px solid #f59e0b' // Đường viền màu cam cảnh báo
      }}>
        {/* ICON THỢ XÂY / BẢO TRÌ */}
        <EngineeringIcon sx={{ fontSize: 100, color: '#f59e0b', mb: 2 }} />
        
        <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
          Đang Nâng Cấp!
        </Typography>
        
        <Typography variant="body1" color="#475569" sx={{ mb: 4, lineHeight: 1.6 }}>
          Chức năng này hiện đang được đội ngũ kỹ thuật phát triển và nâng cấp để mang lại trải nghiệm tốt nhất. Bác vui lòng quay lại sau nhé! 🚀
        </Typography>
        
        {/* NÚT QUAY LẠI */}
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)} // Lệnh này giúp tự động lùi về trang trước đó
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            px: 4, 
            py: 1.5, 
            fontWeight: 700, 
            bgcolor: '#0284c7',
            boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.39)',
            '&:hover': { bgcolor: '#0369a1' }
          }}
        >
          Quay Lại Trang Trước
        </Button>
      </Paper>
    </Box>
  );
};