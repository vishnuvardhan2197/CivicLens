package com.civiclens.civiclens.service;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.ReportStatus;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import com.civiclens.civiclens.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public AnalyticsService(ReportRepository reportRepository,
                            UserRepository userRepository,
                            DepartmentRepository departmentRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    public Map<String, Object> getSummary() {
        long totalComplaints = reportRepository.count();
        long pending = reportRepository.countByStatus(ReportStatus.PENDING);
        long assigned = reportRepository.countByStatus(ReportStatus.ASSIGNED);
        long inProgress = reportRepository.countByStatus(ReportStatus.IN_PROGRESS);
        long resolved = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long rejected = reportRepository.countByStatus(ReportStatus.REJECTED);

        long totalCitizens = userRepository.countByRole(Role.CITIZEN);
        long totalStaff = userRepository.countByRole(Role.MUNICIPAL_STAFF);
        long totalDepartments = departmentRepository.count();

        double resolutionRate = totalComplaints > 0
                ? Math.round(((double) resolved / totalComplaints * 100.0) * 10.0) / 10.0
                : 0.0;

        // Calculate average resolution time in hours
        List<Report> resolvedReports = reportRepository.findResolvedReportsWithTimestamps();
        double avgResolutionHours = 0.0;
        if (!resolvedReports.isEmpty()) {
            long totalMinutes = 0;
            for (Report r : resolvedReports) {
                Duration duration = Duration.between(r.getCreatedAt(), r.getResolvedAt());
                totalMinutes += Math.max(0, duration.toMinutes());
            }
            avgResolutionHours = Math.round(((double) totalMinutes / (resolvedReports.size() * 60.0)) * 10.0) / 10.0;
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalComplaints", totalComplaints);
        summary.put("pendingComplaints", pending);
        summary.put("assignedComplaints", assigned);
        summary.put("inProgressComplaints", inProgress);
        summary.put("resolvedComplaints", resolved);
        summary.put("rejectedComplaints", rejected);
        summary.put("totalCitizens", totalCitizens);
        summary.put("totalMunicipalStaff", totalStaff);
        summary.put("totalDepartments", totalDepartments);
        summary.put("resolutionRatePercent", resolutionRate);
        summary.put("averageResolutionHours", avgResolutionHours);

        return summary;
    }

    public List<Map<String, Object>> getCategoriesAnalytics() {
        List<Object[]> rows = reportRepository.countReportsByCategory();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            String category = row[0] != null ? row[0].toString() : "Uncategorized";
            Long count = ((Number) row[1]).longValue();
            result.add(Map.of("category", category, "count", count));
        }
        return result;
    }

    public List<Map<String, Object>> getDepartmentsAnalytics() {
        List<Object[]> rows = reportRepository.countReportsByDepartment();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            String department = row[0] != null ? row[0].toString() : "Unassigned";
            Long count = ((Number) row[1]).longValue();
            result.add(Map.of("department", department, "count", count));
        }
        return result;
    }

    public List<Map<String, Object>> getMonthlyAnalytics() {
        List<Report> allReports = reportRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        Map<String, Long> submissions = new TreeMap<>();
        Map<String, Long> resolutions = new TreeMap<>();

        for (Report r : allReports) {
            if (r.getCreatedAt() != null) {
                String month = r.getCreatedAt().format(formatter);
                submissions.put(month, submissions.getOrDefault(month, 0L) + 1);
            }
            if (r.getResolvedAt() != null) {
                String month = r.getResolvedAt().format(formatter);
                resolutions.put(month, resolutions.getOrDefault(month, 0L) + 1);
            }
        }

        Set<String> allMonths = new TreeSet<>(submissions.keySet());
        allMonths.addAll(resolutions.keySet());

        List<Map<String, Object>> result = new ArrayList<>();
        for (String month : allMonths) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", month);
            entry.put("submitted", submissions.getOrDefault(month, 0L));
            entry.put("resolved", resolutions.getOrDefault(month, 0L));
            result.add(entry);
        }

        return result;
    }
}
