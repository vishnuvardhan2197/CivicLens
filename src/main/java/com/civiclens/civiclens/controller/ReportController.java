package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.dto.ApiResponse;
import com.civiclens.civiclens.dto.AssignReportRequest;
import com.civiclens.civiclens.dto.StaffUpdateRequest;
import com.civiclens.civiclens.dto.StatusUpdateRequest;
import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.ReportStatusHistory;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.UserRepository;
import com.civiclens.civiclens.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    public ReportController(ReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
    }

    @PostMapping
    public ResponseEntity<Report> createReport(
            @Valid @RequestBody Report report,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        Report created = reportService.createReport(report, user);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllReports(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        if (page != null || size != null || category != null || status != null || priority != null || departmentId != null || search != null) {
            return ResponseEntity.ok(reportService.getReportsPaged(category, status, priority, departmentId, search, pageable));
        }

        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/my")
    public List<Report> getMyReports(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return reportService.getReportsByUser(user);
    }

    @GetMapping({"/staff", "/staff/assigned"})
    @PreAuthorize("hasAnyRole('MUNICIPAL_STAFF', 'ADMIN')")
    public List<Report> getStaffReports(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return reportService.getStaffAssignedReports(user);
    }

    @GetMapping("/staff/{id}")
    @PreAuthorize("hasAnyRole('MUNICIPAL_STAFF', 'ADMIN')")
    public ResponseEntity<Report> getStaffReportById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        Report report = reportService.getStaffReportById(id, user);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        Report report = reportService.getReportByIdAuthorized(id, user);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ReportStatusHistory>> getReportHistory(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        List<ReportStatusHistory> history = reportService.getStatusHistory(id, user);

        return ResponseEntity.ok(history);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Report> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) StatusUpdateRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        String targetStatus = (request != null && request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus()
                : status;

        String remarks = (request != null) ? request.getRemarks() : null;

        Report updated = reportService.updateStatus(id, targetStatus, remarks, user);

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/staff-update")
    @PreAuthorize("hasAnyRole('MUNICIPAL_STAFF', 'ADMIN')")
    public ResponseEntity<Report> updateStaffProgress(
            @PathVariable Long id,
            @Valid @RequestBody StaffUpdateRequest request,
            Authentication authentication) {

        User staff = getAuthenticatedUser(authentication);
        Report updated = reportService.updateStaffProgress(id, request, staff);

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/priority")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Report> updatePriority(
            @PathVariable Long id,
            @RequestParam(required = false) String priority,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        User admin = getAuthenticatedUser(authentication);
        String targetPriority = (body != null && body.containsKey("priority")) ? body.get("priority") : priority;

        Report updated = reportService.updatePriority(id, targetPriority, admin);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Report> assignDepartment(
            @PathVariable Long id,
            @Valid @RequestBody AssignReportRequest request,
            Authentication authentication) {

        User admin = getAuthenticatedUser(authentication);
        Report assigned = reportService.assignDepartmentAndStaff(id, request, admin);

        return ResponseEntity.ok(assigned);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteReport(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        reportService.deleteReport(id, user);

        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully"));
    }
}
