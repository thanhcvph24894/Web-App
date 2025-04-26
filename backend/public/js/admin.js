$(document).ready(function () {
    // Toggle Sidebar
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function () {
        $('.alert').alert('close');
    }, 5000);

    // Initialize DataTable
    const table = $('.datatable').DataTable({
        language: {
            "emptyTable": "Không có dữ liệu",
            "info": "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            "infoEmpty": "Hiển thị 0 đến 0 của 0 mục",
            "infoFiltered": "(được lọc từ _MAX_ mục)",
            "lengthMenu": "Hiển thị _MENU_ mục",
            "loadingRecords": "Đang tải...",
            "processing": "Đang xử lý...",
            "search": "Tìm kiếm:",
            "zeroRecords": "Không tìm thấy kết quả phù hợp",
            "paginate": {
                "first": "Đầu",
                "last": "Cuối",
                "next": "Tiếp",
                "previous": "Trước"
            }
        },
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Tất cả"]],
        order: [[0, 'asc']],
        responsive: true
    });

    // Handle Delete with SweetAlert2
    $(document).on('click', '.delete-item', function (e) {
        e.preventDefault();
        const deleteUrl = $(this).data('url');
        const itemName = $(this).data('name') || 'mục này';

        Swal.fire({
            title: 'Xác nhận xóa?',
            text: `Bạn có chắc chắn muốn xóa ${itemName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: deleteUrl,
                    type: 'DELETE',
                    success: function (response) {
                        if (response.success) {
                            Swal.fire('Đã xóa!', response.message, 'success')
                                .then(() => {
                                    // Refresh the page or remove the row
                                    const row = table.row($(e.target).closest('tr'));
                                    row.remove().draw();
                                });
                        } else {
                            Swal.fire('Lỗi!', response.message, 'error');
                        }
                    },
                    error: function (xhr) {
                        const message = xhr.responseJSON?.message || 'Đã có lỗi xảy ra';
                        Swal.fire('Lỗi!', message, 'error');
                    }
                });
            }
        });
    });

    // Toggle Status with SweetAlert2
    $(document).on('change', '.toggle-status', function () {
        const url = $(this).data('url');
        const isActive = $(this).prop('checked');
        const badgeId = $(this).data('id');
        const badge = $(`#${badgeId}`);
        const originalState = !isActive; // Lưu trạng thái ban đầu

        Swal.fire({
            title: 'Xác nhận thay đổi?',
            text: `Bạn có chắc chắn muốn ${isActive ? 'kích hoạt' : 'ẩn'} danh mục này?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: url,
                    type: 'PUT',
                    data: { isActive: isActive },
                    success: function (response) {
                        if (response.success) {
                            // Cập nhật badge
                            badge.attr('data-active', isActive)
                                .text(isActive ? 'Hoạt động' : 'Ẩn');

                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công',
                                text: response.message,
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000
                            });
                        } else {
                            // Reset về trạng thái cũ nếu có lỗi
                            $(this).prop('checked', originalState);
                            badge.attr('data-active', originalState)
                                .text(originalState ? 'Hoạt động' : 'Ẩn');

                            Swal.fire('Lỗi!', response.message, 'error');
                        }
                    },
                    error: function (xhr) {
                        // Reset về trạng thái cũ nếu có lỗi
                        $(this).prop('checked', originalState);
                        badge.attr('data-active', originalState)
                            .text(originalState ? 'Hoạt động' : 'Ẩn');

                        const message = xhr.responseJSON?.message || 'Đã có lỗi xảy ra';
                        Swal.fire('Lỗi!', message, 'error');
                    }
                });
            } else {
                // Nếu người dùng hủy, reset về trạng thái cũ
                $(this).prop('checked', originalState);
                badge.attr('data-active', originalState)
                    .text(originalState ? 'Hoạt động' : 'Ẩn');
            }
        });
    });

    // Image Preview
    $('.image-input').on('change', function () {
        const file = this.files[0];
        const preview = $(this).data('preview');
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $(preview).attr('src', e.target.result).show();
            }
            reader.readAsDataURL(file);
        }
    });

    // Price Format
    $('.price-input').on('input', function () {
        let value = $(this).val().replace(/\D/g, '');
        value = new Intl.NumberFormat('vi-VN').format(value);
        $(this).val(value);
    });

    // Form Validation
    $('form').on('submit', function (e) {
        const requiredFields = $(this).find('[required]');
        let isValid = true;

        requiredFields.each(function () {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('is-invalid');
            } else {
                $(this).removeClass('is-invalid');
            }
        });

        if (!isValid) {
            e.preventDefault();
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    });

    // Reset Form
    $('.btn-reset').on('click', function () {
        const form = $(this).closest('form');
        form[0].reset();
        form.find('.is-invalid').removeClass('is-invalid');
        form.find('img[id^="imagePreview"]').attr('src', '').hide();
    });
}); 