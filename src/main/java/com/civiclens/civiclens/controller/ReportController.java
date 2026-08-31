package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.UserRepository;
import com.civiclens.civiclens.service.ReportService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin("*")
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    public ReportController(
            ReportService reportService,
            UserRepository userRepository) {

        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Report createReport(
            @RequestBody Report report,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        report.setUser(user);

        // Every new report starts with PENDING status
        report.setStatus("PENDING");

        return reportService.saveReport(report);
    }

    @GetMapping
    public List<Report> getAllReports() {
        return reportService.getAllReports();
    }

    @GetMapping("/my")
    public List<Report> getMyReports(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return reportService.getReportsByUser(user);
    }

    @GetMapping("/{id}")
    public Report getReportById(@PathVariable Long id) {
        return reportService.getReportById(id);
    }

    @PutMapping("/{id}/status")
    public Report updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return reportService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String deleteReport(@PathVariable Long id) {

        reportService.deleteReport(id);

        return "Report deleted successfully";
    }
}