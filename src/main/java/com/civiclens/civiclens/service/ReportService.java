package com.civiclens.civiclens.service;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.repository.ReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import java.util.Optional;

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
        return reportRepository.findById(id).orElse(null);
    }
    public Report updateReport(Long id, Report updatedReport) {
        Report report = reportRepository.findById(id).orElse(null);

        if (report != null) {
            report.setTitle(updatedReport.getTitle());
            report.setDescription(updatedReport.getDescription());
            report.setLocation(updatedReport.getLocation());
            report.setImageUrl(updatedReport.getImageUrl());
            report.setStatus(updatedReport.getStatus());

            return reportRepository.save(report);
        }

        return null;
    }
    public void deleteReport(Long id) {
        reportRepository.deleteById(id);
    }
}