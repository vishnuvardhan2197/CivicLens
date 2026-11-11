package com.civiclens.civiclens.model;

public enum ReportStatus {
    PENDING,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED,
    REJECTED;

    public static ReportStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return PENDING;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        try {
            return ReportStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }
}
