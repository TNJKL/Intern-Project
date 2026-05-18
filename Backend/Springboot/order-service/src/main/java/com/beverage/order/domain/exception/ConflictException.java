package com.beverage.order.domain.exception;

public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(message, "CONFLICT");
    }
}
