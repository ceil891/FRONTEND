describe('Nghiệp vụ: Quản lý Kho hàng (Inventory)', () => {
  beforeEach(() => {
    // Giả lập nhân viên đã đăng nhập thành công
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="username"]').type('super@example.com');
    cy.get('input[name="password"]').type('Default123!');
    cy.get('button[type="submit"]').click();
    
    // Chuyển tới trang Quản lý sản phẩm
    cy.visit('http://localhost:3000/inventory/products');
  });

  it('TC03: Thêm mới sản phẩm vào chuỗi bán lẻ', () => {
    // Tạo mã ngẫu nhiên để không bị lỗi trùng mã SP
    const productCode = 'SP_' + new Date().getTime(); 
    
    cy.contains('Thêm mới').click(); // Hoặc cy.get('.btn-add').click()

    // Điền thông tin cơ bản
    cy.get('input[name="code"]').type(productCode);
    cy.get('input[name="name"]').type('Áo thun đồng phục CMC');
    
    // CỰC KỲ QUAN TRỌNG: Phải chọn các trường khóa ngoại
    cy.get('select[name="categoryId"]').select('Thời trang'); // Tên hiển thị trên web
    cy.get('select[name="unitId"]').select('Cái');
    cy.get('select[name="supplierId"]').select('NCC Tổng');

    // Điền giá tiền
    cy.get('input[name="baseCostPrice"]').type('100000');
    cy.get('input[name="baseRetailPrice"]').type('150000');

    // Bấm Lưu
    cy.get('button[type="submit"]').click();

    // Xác nhận Frontend hiển thị thông báo thành công từ Backend trả về
    cy.contains('Thêm mới sản phẩm thành công').should('be.visible');
    cy.contains(productCode).should('be.visible'); // Bảng dữ liệu phải hiện SP này
  });
});