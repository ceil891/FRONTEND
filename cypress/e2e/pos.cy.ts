describe('Nghiệp vụ: Bán hàng tại quầy (POS)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    
    cy.visit('http://localhost:3000/pos'); // Đường dẫn màn hình thu ngân
  });

  it('TC04: Tạo hóa đơn bán lẻ thành công', () => {
    // 1. Tìm và chọn sản phẩm vào giỏ hàng
    cy.get('input[placeholder="Tìm kiếm mã hoặc tên sản phẩm..."]').type('Áo thun');
    cy.contains('Áo thun đồng phục CMC').click(); // Click chọn sản phẩm hiện ra

    // 2. Tăng số lượng lên 2
    cy.get('.btn-increase-qty').click(); 

    // 3. Khách đưa tiền
    cy.get('input[name="customerPay"]').clear().type('500000');

    // 4. Bấm thanh toán
    cy.contains('Thanh toán').click();
    cy.contains('Xác nhận').click(); // Có thể có popup xác nhận

    // 5. Kiểm tra hóa đơn được tạo và giỏ hàng trống lại
    cy.contains('Thanh toán thành công').should('be.visible');
    cy.contains('Tiền thừa trả khách').should('be.visible');
  });
});