package com.beverage.product.presentation.config;

import com.beverage.product.common.ApiResponse;
import com.beverage.product.domain.exception.BusinessException;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.storage.StorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        HttpStatus httpStatus = HttpStatus.resolve(status);
        if (httpStatus == null) {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String reason = ex.getReason() != null ? ex.getReason() : httpStatus.getReasonPhrase();
        log.warn("HTTP {}: {}", httpStatus.value(), reason);
        return ResponseEntity.status(httpStatus)
                .body(ApiResponse.error(reason));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        log.error("Business error: {} [{}]", ex.getMessage(), ex.getErrorCode());

        // Skeleton: các usecase sau sẽ set errorCode cụ thể.
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageException(StorageException ex) {
        log.warn("Storage: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Vi phạm ràng buộc DB: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(
                        "Dữ liệu không thỏa ràng buộc cơ sở dữ liệu (ví dụ slug trùng với sản phẩm khác, hoặc danh sách topping có id trùng lặp)."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.error("Validation errors: {}", errors);

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Dữ liệu không hợp lệ")
                .data(errors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."));
    }
}

