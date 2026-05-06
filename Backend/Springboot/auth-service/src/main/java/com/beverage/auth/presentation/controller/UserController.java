package com.beverage.auth.presentation.controller;

import com.beverage.auth.application.dto.request.CreateUserRequest;
import com.beverage.auth.application.dto.request.ChangePasswordRequest;
import com.beverage.auth.application.dto.request.UpdateUserRequest;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.common.ApiResponse;
import com.beverage.auth.domain.exception.AuthException;
import com.beverage.auth.infrastructure.security.JwtUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs quản lý người dùng")
public class UserController {

    private final com.beverage.auth.application.usecase.UserUseCase userUseCase;

    @PostMapping
    @Operation(summary = "Tạo người dùng mới", description = "Tạo một người dùng mới trong hệ thống")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo người dùng thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email đã tồn tại")
    })
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userUseCase.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "Tạo người dùng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin người dùng theo ID", description = "Truy xuất thông tin người dùng bằng ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tìm thấy người dùng"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "ID người dùng") @PathVariable UUID id) {
        UserResponse user = userUseCase.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Lấy thông tin người dùng theo Email", description = "Truy xuất thông tin người dùng bằng Email")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(
            @Parameter(description = "Email người dùng") @PathVariable String email) {
        UserResponse user = userUseCase.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng", description = "Truy xuất danh sách người dùng với phân trang")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số lượng phần tử mỗi trang") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Trường sắp xếp") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Hướng sắp xếp (ASC/DESC)") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Lọc theo role") @RequestParam(required = false) String role,
            @Parameter(description = "Lọc theo trạng thái") @RequestParam(required = false) Boolean isActive) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserResponse> users;
        if (role != null) {
            users = userUseCase.getUsersByRole(role, pageable);
        } else if (isActive != null) {
            users = userUseCase.getUsersByActiveStatus(isActive, pageable);
        } else {
            users = userUseCase.getAllUsers(pageable);
        }

        ApiResponse.PaginationInfo pagination = ApiResponse.PaginationInfo.builder()
                .totalPages(users.getTotalPages())
                .totalElements(users.getTotalElements())
                .currentPage(users.getNumber())
                .pageSize(users.getSize())
                .build();

        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách người dùng thành công", pagination));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật người dùng", description = "Cập nhật thông tin người dùng")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email đã tồn tại")
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @Parameter(description = "ID người dùng") @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userUseCase.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Cập nhật người dùng thành công"));
    }

    @PutMapping("/me")
    @Operation(summary = "Người dùng tự cập nhật thông tin cá nhân", description = "Cập nhật thông tin cá nhân của chính mình qua JWT")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserRequest request) {
        UUID userId = extractCurrentUserId(authentication);

        // Người dùng tự cập nhật profile không được tự đổi password/role/trạng thái tài khoản
        request.setPassword(null);
        request.setRole(null);
        request.setIsActive(null);

        UserResponse user = userUseCase.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Cập nhật thông tin cá nhân thành công"));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Người dùng tự đổi mật khẩu", description = "Đổi mật khẩu bằng oldPassword/newPassword và thu hồi toàn bộ session, refresh token")
    public ResponseEntity<ApiResponse<Void>> changeMyPassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = extractCurrentUserId(authentication);
        userUseCase.changeMyPassword(userId, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa người dùng", description = "Xóa người dùng khỏi hệ thống")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @Parameter(description = "ID người dùng") @PathVariable UUID id) {
        userUseCase.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa người dùng thành công"));
    }

    private UUID extractCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new AuthException("Token không hợp lệ hoặc thiếu token", "ACCESS_TOKEN_INVALID");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUserPrincipal jwtPrincipal) {
            return jwtPrincipal.getUserId();
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException ex) {
            throw new AuthException("Token không hợp lệ", "ACCESS_TOKEN_INVALID");
        }
    }
}
