describe('Chức năng Đăng nhập', () => {
  beforeEach(() => {
    // Truy cập trang đăng nhập trước mỗi test case
    cy.visit('/login');
  });

  it('Hiển thị lỗi khi sai thông tin đăng nhập', () => {
    // Giả lập API trả về lỗi 401
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Sai thông tin đăng nhập' }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('wrong@email.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('button', 'Đăng Nhập').click();

    cy.wait('@loginRequest');
    
    // Kiểm tra thông báo lỗi hiển thị trên UI
    cy.contains('Sai thông tin đăng nhập').should('be.visible');
  });

  it('Đăng nhập thành công với tài khoản Admin và chuyển hướng', () => {
    // Giả lập API trả về thành công
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: { accessToken: 'mock-jwt-token', role: 'ADMIN', fullName: 'Admin' }
      }
    }).as('loginSuccess');

    cy.get('input[type="email"]').type('admin@retail.com');
    cy.get('input[type="password"]').type('Admin@123');
    cy.contains('button', 'Đăng Nhập').click();

    cy.wait('@loginSuccess');

    // Kiểm tra token được lưu vào localStorage
    cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'mock-jwt-token');

    // Kiểm tra điều hướng đúng trang dành cho ADMIN
    cy.url().should('include', '/dashboard');
  });

  it('Đăng nhập thành công với tài khoản Nhân viên (Staff)', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: { accessToken: 'mock-staff-token', role: 'STAFF', fullName: 'Nhân viên POS' }
      }
    }).as('loginStaff');

    cy.get('input[type="email"]').type('staff@retail.com');
    cy.get('input[type="password"]').type('Staff@123');
    cy.contains('button', 'Đăng Nhập').click();

    cy.wait('@loginStaff');
    
    // Nhân viên thì phải vào thẳng màn hình POS
    cy.url().should('include', '/pos');
  });
});