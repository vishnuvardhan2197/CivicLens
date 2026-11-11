package com.civiclens.civiclens.model;

public enum Role {
    CITIZEN,
    MUNICIPAL_STAFF,
    ADMIN;

    public static Role fromString(String value) {
        if (value == null || value.isBlank()) {
            return CITIZEN;
        }
        String normalized = value.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        if ("USER".equals(normalized)) {
            return CITIZEN;
        }
        if ("STAFF".equals(normalized)) {
            return MUNICIPAL_STAFF;
        }
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return CITIZEN;
        }
    }
}
