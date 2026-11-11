package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MUNICIPAL_STAFF', 'CITIZEN')")
    public ResponseEntity<List<Map<String, Object>>> getCategoriesAnalytics() {
        return ResponseEntity.ok(analyticsService.getCategoriesAnalytics());
    }

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MUNICIPAL_STAFF')")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentsAnalytics() {
        return ResponseEntity.ok(analyticsService.getDepartmentsAnalytics());
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyAnalytics() {
        return ResponseEntity.ok(analyticsService.getMonthlyAnalytics());
    }
}
