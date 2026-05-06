package com.beverage.auth.domain.exception;

public class AuthException extends RuntimeException {

    private final String errorCode;

    public AuthException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public static class InvalidCredentialsException extends AuthException {
        public InvalidCredentialsException() {
            super("Email hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS");
        }
    }

    public static class TokenExpiredException extends AuthException {
        public TokenExpiredException() {
            super("Token đã hết hạn", "TOKEN_EXPIRED");
        }
    }

    public static class TokenBlacklistedException extends AuthException {
        public TokenBlacklistedException() {
            super("Token đã bị vô hiệu hóa", "TOKEN_BLACKLISTED");
        }
    }

    public static class AccessTokenInvalidException extends AuthException {
        public AccessTokenInvalidException() {
            super("Access token không hợp lệ hoặc đã hết hạn", "ACCESS_TOKEN_INVALID");
        }
    }

    public static class UserBannedException extends AuthException {
        public UserBannedException() {
            super("Tài khoản đã bị khóa", "USER_BANNED");
        }
    }

    public static class UserInactiveException extends AuthException {
        public UserInactiveException() {
            super("Tài khoản đã bị vô hiệu hóa", "USER_INACTIVE");
        }
    }

    public static class RefreshTokenUsedException extends AuthException {
        public RefreshTokenUsedException() {
            super("Refresh token đã được sử dụng", "REFRESH_TOKEN_USED");
        }
    }

    public static class RefreshTokenInvalidException extends AuthException {
        public RefreshTokenInvalidException() {
            super("Refresh token không hợp lệ", "REFRESH_TOKEN_INVALID");
        }
    }
}
