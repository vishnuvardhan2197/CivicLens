package com.civiclens.civiclens.service;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.repository.ReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public Report saveReport(Report report) {
        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }
    public Report getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));
    }
    public Report updateStatus(Long id, String status) {

        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(status);

        return reportRepository.save(report);
    }
    public void deleteReport(Long id) {

        if (!reportRepository.existsById(id)) {
            throw new RuntimeException("Report not found");
        }

        reportRepository.deleteById(id);
    }
}