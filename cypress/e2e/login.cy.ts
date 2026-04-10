describe('Nghiệp vụ: Xác thực nhân viên (Login)', () => {
  beforeEach(() => {
    // Truy cập trang đăng nhập (Cypress tự lấy baseUrl nếu Ngọc đã config)
    cy.visit('http://localhost:3000/login'); 
  });

  it('TC01: Đăng nhập thất bại khi sai thông tin', () => {
    cy.get('input[name="username"]').type('nhanvien_kho');
    cy.get('input[name="password"]').type('mat_khau_sai');
    cy.get('button[type="submit"]').click();
    
    // Hệ thống phải chặn lại và báo lỗi
    cy.contains('Tài khoản hoặc mật khẩu không đúng').should('be.visible');
  });

  it('TC02: Đăng nhập thành công và vào Dashboard', () => {
    cy.get('input[name="username"]').type('super@example.com');
    cy.get('input[name="password"]').type('Default123!'); // Pass thật trong DB của Ngọc
    cy.get('button[type="submit"]').click();
    
    // Đảm bảo URL chuyển hướng đúng và Giao diện hiện lời chào
    cy.url().should('include', '/dashboard');
    cy.contains('Tổng quan hệ thống').should('be.visible');
  });
});