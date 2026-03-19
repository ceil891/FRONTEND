describe('Quản lý Thuộc tính - Màu sắc', () => {
  beforeEach(() => {
    // Giả lập đã đăng nhập (Set token hợp lệ)
    window.localStorage.setItem('token', 'fake-admin-token');
    
    // Giả lập API danh sách màu ban đầu
    cy.intercept('GET', '/api/inventory/colors', {
      body: { 
        success: true, 
        data: [{ id: 1, name: 'Đen', hexCode: '#000000', status: 'ACTIVE' }] 
      }
    }).as('getColors');

    // Truy cập trực tiếp trang Quản lý màu sắc
    cy.visit('/products/colors');
    cy.wait('@getColors');
  });

  it('Hiển thị danh sách màu sắc ban đầu', () => {
    cy.contains('Quản lý Màu sắc').should('be.visible');
    cy.contains('td', 'Đen').should('be.visible');
    cy.contains('td', '#000000').should('be.visible');
  });

  it('Thêm mới một màu sắc thành công', () => {
    // Giả lập API trả về thành công khi thêm mới
    cy.intercept('POST', '/api/inventory/colors', {
      statusCode: 200,
      body: { success: true, message: 'Thêm mới thành công', data: { id: 2, name: 'Đỏ', hexCode: '#FF0000', status: 'ACTIVE' } }
    }).as('createColor');

    // Click nút Thêm mới
    cy.contains('button', 'Thêm mới').click();

    // Điền form (giả định có Dialog form)
    cy.get('input[name="name"]').type('Đỏ');
    cy.get('input[name="hexCode"]').type('#FF0000');
    
    // Click nút Lưu
    cy.contains('button', 'Lưu').click();
    cy.wait('@createColor');

    // Kiểm tra thông báo thành công
    cy.contains('Thêm mới thành công').should('be.visible');
  });

  it('Báo lỗi khi bỏ trống Tên màu', () => {
    cy.contains('button', 'Thêm mới').click();
    
    // Cố tình focus rồi click ra ngoài hoặc bấm Lưu luôn để trigger validation
    cy.contains('button', 'Lưu').click();

    // Kiểm tra UI có hiện chữ báo lỗi không (tùy thuộc vào thư viện form bạn dùng: react-hook-form, yup...)
    cy.contains('Tên màu không được để trống').should('be.visible');
  });

  it('Xóa một màu sắc', () => {
    cy.intercept('DELETE', '/api/inventory/colors/1', {
      statusCode: 200,
      body: { success: true, message: 'Xóa thành công' }
    }).as('deleteColor');

    // Tìm dòng chứa chữ "Đen" và click vào nút Xóa (giả định là icon thùng rác hoặc nút text)
    // Tùy giao diện, có thể dùng cy.get('table tr').eq(1).find('button[aria-label="delete"]').click()
    cy.contains('tr', 'Đen').find('button').last().click(); // Giả sử nút xóa nằm cuối cùng

    // Giả định có hộp thoại confirm
    cy.contains('Bạn có chắc chắn muốn xóa').should('be.visible');
    cy.contains('button', 'Đồng ý').click();

    cy.wait('@deleteColor');
    cy.contains('Xóa thành công').should('be.visible');
  });
});