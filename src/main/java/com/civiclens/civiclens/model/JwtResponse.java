package com.civiclens.civiclens.model;

public class JwtResponse {

    private String token;
    private String role;
    private String email;
    private String name;
    private Long userId;

    public JwtResponse() {
    }

    public JwtResponse(String token) {
        this.token = token;
    }

    public JwtResponse(String token, String role) {
        this.token = token;
        this.role = role;
    }

    public JwtResponse(String token, String role, String email, String name, Long userId) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.name = name;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
