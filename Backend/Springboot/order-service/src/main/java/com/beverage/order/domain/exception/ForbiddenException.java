package com.beverage.order.domain.exception;

public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(message, "FORBIDDEN");
    }
}
