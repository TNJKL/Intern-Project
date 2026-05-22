package com.beverage.order.domain.exception;

public class TooManyRequestsException extends BusinessException {

    public TooManyRequestsException(String message) {
        super(message, "TOO_MANY_REQUESTS");
    }
}
