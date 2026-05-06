package com.beverage.auth.domain.exception;

/**
 * Exception khi resource không tìm thấy
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s không tìm thấy với %s = '%s'", resourceName, fieldName, fieldValue));
    }
}
