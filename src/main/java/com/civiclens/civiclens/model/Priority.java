package com.civiclens.civiclens.model;

public enum Priority {
    LOW,
    MEDIUM,
    HIGH,
    EMERGENCY;

    public static Priority fromString(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        String normalized = value.trim().toUpperCase();
        try {
            return Priority.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return MEDIUM;
        }
    }
}
