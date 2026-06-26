package com.beverage.order.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    @Pattern(regexp = "^[a-zA-ZÀ-ỹ\\s]+$", message = "Họ tên chỉ chứa chữ cái và khoảng trắng")
    private String userName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email tối đa 255 ký tự")
    private String userEmail;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(03|05|07|08|09)\\d{8}$", message = "Số điện thoại không đúng định dạng (10 số, bắt đầu bằng 03, 05, 07, 08, 09)")
    private String userPhone;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ giao hàng phải từ 10 đến 500 ký tự")
    private String deliveryAddress;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Pattern(regexp = "^(cod|vnpay)$", message = "Phương thức thanh toán không hợp lệ")
    private String paymentMethod;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String note;

    @NotEmpty(message = "Giỏ hàng không được để trống")
    @Valid
    private List<OrderLineRequest> items = new ArrayList<>();

    private String voucherCode;
}
