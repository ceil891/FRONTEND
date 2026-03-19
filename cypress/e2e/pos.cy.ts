describe('Luồng Bán Hàng POS', () => {
  beforeEach(() => {
    // Giả lập trạng thái đã đăng nhập bằng cách set token
    window.localStorage.setItem('token', 'fake-valid-token');
    
    // Giả lập thông tin user trong Zustand persist storage
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        isAuthenticated: true,
        user: { id: 1, fullName: 'Thu ngân A', role: 'STAFF' },
        token: 'fake-valid-token'
      }
    }));

    // Mock API danh sách cửa hàng
    cy.intercept('GET', '/api/core/stores', {
      body: { success: true, data: [{ id: 1, name: 'Cửa hàng Trung Tâm' }] }
    }).as('getStores');

    // Mock API danh sách sản phẩm
    cy.intercept('GET', '/api/inventory/products', {
      body: { success: true, data: [
        { id: '101', code: 'SKU01', name: 'Áo Sơ Mi Nam', price: 250000, isActive: true },
        { id: '102', code: 'SKU02', name: 'Quần Kaki', price: 300000, isActive: true }
      ]}
    }).as('getProducts');

    cy.visit('/pos');
    cy.wait(['@getStores', '@getProducts']);
  });

  it('Thực hiện trọn vẹn một đơn hàng tại quầy', () => {
    // 1. Chọn cửa hàng
    cy.contains('Cửa hàng Trung Tâm').click();
    cy.contains('POS Bán Hàng').should('be.visible');

    // 2. Thêm sản phẩm vào giỏ
    cy.contains('Áo Sơ Mi Nam').click();
    cy.contains('Quần Kaki').click();
    
    // Tăng số lượng Áo Sơ Mi lên 2 (giả sử nút '+' có icon AddIcon)
    // Dùng .eq(0) để lấy nút cộng của sản phẩm đầu tiên
    cy.get('table tbody tr').eq(0).find('button').last().click(); 

    // Kiểm tra tính toán Tạm tính: (250k * 2) + 300k = 800.000đ
    cy.contains('800.000').should('exist');

    // 3. Nhập mã giảm giá
    cy.get('input[placeholder*="Mã giảm giá"]').type('GIAM10');
    cy.contains('button', 'Áp dụng').click();
    cy.contains('Đã áp dụng mã!').should('be.visible'); // Toast message

    // 4. Thanh toán (Tiền mặt là mặc định)
    cy.intercept('POST', '/api/sales/orders', {
      statusCode: 200,
      body: { success: true, message: 'Tạo đơn thành công' }
    }).as('createOrder');

    // Bấm nút THANH TOÁN
    cy.contains('button', 'THANH TOÁN').click();
    cy.wait('@createOrder');

    // Kiểm tra thông báo thành công và giỏ hàng được làm trống
    cy.contains('Thanh toán thành công!').should('be.visible');
    cy.contains('Giỏ hàng trống').should('be.visible');
  });

  it('Hiển thị mã QR khi chọn thanh toán chuyển khoản', () => {
    cy.contains('Cửa hàng Trung Tâm').click();
    cy.contains('Áo Sơ Mi Nam').click();

    // Chọn phương thức chuyển khoản
    cy.contains('Chuyển khoản').click();
    
    // Bấm Thanh toán
    cy.contains('button', 'THANH TOÁN').click();

    // Dialog QR phải hiện ra thay vì gọi API luôn
    cy.contains('Thanh Toán Chuyển Khoản').should('be.visible');
    cy.get('img[alt="QR Code"]').should('exist');
    
    // Xác nhận đã nhận tiền trên dialog
    cy.intercept('POST', '/api/sales/orders', { body: { success: true } }).as('confirmTransfer');
    cy.contains('button', 'Đã Nhận Tiền').click();
    cy.wait('@confirmTransfer');
  });
});