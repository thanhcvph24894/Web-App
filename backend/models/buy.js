$(document).ready(function () {
    const table = $('#usersTable').DataTable({
        language: {
            emptyTable: "Không có dữ liệu",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
            infoFiltered: "(lọc từ _MAX_ mục)",
            lengthMenu: "Hiển thị _MENU_ mục",
            loadingRecords: "Đang tải...",
            processing: "Đang xử lý...",
            search: "Tìm kiếm:",
            zeroRecords: "Không tìm thấy kết quả phù hợp",
            paginate: {
                first: "Đầu",
                last: "Cuối",
                next: "Tiếp",
                previous: "Trước"
            }
        },
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Tất cả"]],
        order: [[3, 'desc']],
        responsive: true
    });

    // Xử lý xóa user
    $('#usersTable').on('click', '.delete-user', function () {
        const $button = $(this);
        const userId = $button.data('id');
        const row = table.row($button.closest('tr'));

        Swal.fire({
            title: 'Xác nhận xóa?',
            text: 'Bạn có chắc chắn muốn xóa người dùng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/users/delete/${userId}`,
                    method: 'DELETE',
                    success: function (response) {
                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Đã xóa',
                                text: response.message,
                                showConfirmButton: false,
                                timer: 1500
                            });
                            row.remove().draw();
                        } else {
                            Swal.fire('Lỗi!', response.message, 'error');
                        }
                    },
                    error: function () {
                        Swal.fire('Lỗi!', 'Có lỗi xảy ra khi xóa người dùng', 'error');
                    }
                });
            }
        });
    });

    // Xử lý toggle trạng thái
    $('#usersTable').on('change', '.status-toggle', function () {
        const $checkbox = $(this);
        const userId = $checkbox.data('id');
        const status = $checkbox.prop('checked') ? 'active' : 'inactive';
        const originalState = !$checkbox.prop('checked');

        Swal.fire({
            title: 'Xác nhận thay đổi?',
            text: `Bạn có chắc chắn muốn ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} người dùng này?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/users/status/${userId}`,
                    method: 'PATCH',
                    data: { status },
                    success: function (response) {
                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Cập nhật thành công',
                                text: response.message,
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000
                            });
                        } else {
                            $checkbox.prop('checked', originalState);
                            Swal.fire('Lỗi!', response.message, 'error');
                        }
                    },
                    error: function () {
                        $checkbox.prop('checked', originalState);
                        Swal.fire('Lỗi!', 'Không thể cập nhật trạng thái', 'error');
                    }
                });
            } else {
                $checkbox.prop('checked', originalState);
            }
        });
    });

    // Preview avatar khi upload
    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            Swal.fire('Lỗi!', 'Vui lòng chọn đúng định dạng ảnh', 'error');
            $(this).val('');
        }
    });

    // Validate mật khẩu khi submit
    $('form').on('submit', function (e) {
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        if (password && password !== confirmPassword) {
            e.preventDefault();
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Mật khẩu xác nhận không khớp',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    });
});
