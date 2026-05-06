package com.beverage.auth.infrastructure.security;

import com.beverage.auth.domain.entity.User;
import com.beverage.auth.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret-key}")
    private String secretKey;

    @Value("${jwt.access-token-expiration:900000}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(User user) {
        return generateToken(user, accessTokenExpiration, "access");
    }

    public String generateRefreshToken(User user) {
        return generateToken(user, refreshTokenExpiration, "refresh");
    }

    private String generateToken(User user, long expiration, String tokenType) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .id(jti)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("fullName", user.getFullName())
                .claim("tokenType", tokenType)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractJti(String token) {
        return extractClaims(token).getId();
    }

    public UUID extractUserId(String token) {
        String subject = extractClaims(token).getSubject();
        return UUID.fromString(subject);
    }

    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    public UserRole extractRole(String token) {
        String role = extractClaims(token).get("role", String.class);
        return UserRole.valueOf(role);
    }

    public String extractTokenType(String token) {
        return extractClaims(token).get("tokenType", String.class);
    }

    public long extractRemainingTtlSeconds(String token) {
        Date expiration = extractClaims(token).getExpiration();
        long remaining = (expiration.getTime() - System.currentTimeMillis()) / 1000;
        return Math.max(0, remaining);
    }

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
}
