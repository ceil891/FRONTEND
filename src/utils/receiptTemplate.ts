import { OrderDetail } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export const generateReceiptHTML = (
  cart: OrderDetail[], 
  subtotal: number, 
  discount: number, 
  total: number, 
  cashierName: string = 'Đào Quang Thành'
) => {
  const today = new Date().toLocaleString('vi-VN');

  return `
    <html>
      <head>
        <title>Hóa Đơn Bán Hàng</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; color: #000; font-size: 14px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border-bottom: 1px dashed #000; padding: 5px 0; text-align: left; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h2 class="center" style="margin-bottom: 5px;">SMART RETAIL</h2>
        <div class="center" style="font-size: 12px; margin-bottom: 10px;">
          ĐC: Cửa hàng trung tâm<br>
          SĐT: 0988.xxx.xxx
        </div>
        <hr>
        <div>Ngày: ${today}</div>
        <div>Thu ngân: ${cashierName}</div>
        <hr>
        <table>
          <tr>
            <th>Tên SP</th>
            <th class="center">SL</th>
            <th class="right">T.Tiền</th>
          </tr>
          ${cart.map(item => `
            <tr>
              <td style="padding-right: 5px;">${item.productName}</td>
              <td class="center">${item.quantity}</td>
              <td class="right">${formatCurrency(item.unitPrice * item.quantity)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="right">Tạm tính: ${formatCurrency(subtotal)}</div>
        ${discount > 0 ? `<div class="right">Giảm giá: -${formatCurrency(discount)}</div>` : ''}
        <hr>
        <h3 class="right bold" style="margin: 5px 0;">Tổng: ${formatCurrency(total)}</h3>
        <hr>
        <div class="center" style="font-size: 12px; margin-top: 20px;">
          Cảm ơn quý khách và hẹn gặp lại!<br>
          <i>Powered by Smart Retail</i>
        </div>
      </body>
    </html>
  `;
};