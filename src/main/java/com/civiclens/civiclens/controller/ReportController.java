package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin("*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public Report saveReport(@RequestBody Report report) {
        return reportService.saveReport(report);
    }

    @GetMapping
    public List<Report> getAllReports() {
        return reportService.getAllReports();
    }

    @GetMapping("/{id}")
    public Report getReportById(@PathVariable Long id) {
        return reportService.getReportById(id);
    }

    @PutMapping("/{id}")
    public Report updateReport(@PathVariable Long id, @RequestBody Report report) {
        return reportService.updateReport(id, report);
    }
    @PutMapping("/test")
    public String testPut() {
        return "PUT is working";
    }
    @DeleteMapping("/{id}")
    public String deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return "Report deleted successfully!";
    }
}