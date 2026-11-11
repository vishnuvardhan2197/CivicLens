package com.civiclens.civiclens.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${civiclens.jwt.secret:mySecretKeyForJwtAuthenticationMustBeAtLeast32CharactersLong}")
    private String secretKey;

    @Value("${civiclens.jwt.expiration-ms:86400000}")
    private long expirationTime;

    private Key key;

    @PostConstruct
    public void init() {
        // Ensure secret key is at least 32 bytes for HMAC-SHA256
        byte[] keyBytes = secretKey.getBytes();
        if (keyBytes.length < 32) {
            String padded = String.format("%-32s", secretKey).replace(' ', '0');
            keyBytes = padded.getBytes();
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username) {
        return generateToken(username, "CITIZEN", null);
    }

    public String generateToken(String username, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role);
        }
        if (userId != null) {
            claims.put("userId", userId);
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        Object role = extractAllClaims(token).get("role");
        return role != null ? role.toString() : null;
    }

    public Long extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    public boolean validateToken(String token, String username) {
        try {
            String extractedUsername = extractUsername(token);
            return extractedUsername.equalsIgnoreCase(username) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token)
                .getExpiration()
                .before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
