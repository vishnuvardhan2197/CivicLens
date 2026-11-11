package com.civiclens.civiclens.service;

import com.civiclens.civiclens.dto.AssignReportRequest;
import com.civiclens.civiclens.dto.ReportRequest;
import com.civiclens.civiclens.dto.StaffUpdateRequest;
import com.civiclens.civiclens.dto.StatusUpdateRequest;
import com.civiclens.civiclens.exception.InvalidOperationException;
import com.civiclens.civiclens.exception.ResourceNotFoundException;
import com.civiclens.civiclens.exception.UnauthorizedActionException;
import com.civiclens.civiclens.model.*;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import com.civiclens.civiclens.repository.ReportStatusHistoryRepository;
import com.civiclens.civiclens.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository,
                         ReportStatusHistoryRepository historyRepository,
                         DepartmentRepository departmentRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Report createReport(Report report, User user) {
        report.setUser(user);
        report.setStatus(ReportStatus.PENDING);
        if (report.getPriority() == null) {
            report.setPriority(Priority.MEDIUM);
        }

        Report saved = reportRepository.save(report);

        ReportStatusHistory initialHistory = new ReportStatusHistory(
                saved,
                null,
                ReportStatus.PENDING,
                user,
                "Complaint filed by " + (user != null ? user.getName() : "citizen")
        );
        historyRepository.save(initialHistory);

        // Generate confirmation notification for citizen
        if (user != null) {
            notificationService.sendNotification(
                    user,
                    "Complaint Submitted",
                    "Your complaint #" + saved.getId() + " ('" + saved.getTitle() + "') has been received and is under review.",
                    NotificationType.COMPLAINT_SUBMITTED,
                    saved
            );
        }

        return saved;
    }

    @Transactional
    public Report createReportFromDto(ReportRequest request, User user) {
        Report report = new Report();
        report.setTitle(request.getTitle().trim());
        report.setDescription(request.getDescription().trim());
        report.setCategory(request.getCategory().trim());
        report.setLatitude(request.getLatitude());
        report.setLongitude(request.getLongitude());
        report.setAddress(request.getAddress());
        report.setImageUrl(request.getImageUrl());
        report.setPriority(request.getPriority() != null ? Priority.fromString(request.getPriority()) : Priority.MEDIUM);

        return createReport(report, user);
    }

    // Preserved for backward compatibility
    @Transactional
    public Report saveReport(Report report) {
        if (report.getStatus() == null) {
            report.setStatus(ReportStatus.PENDING);
        }
        if (report.getPriority() == null) {
            report.setPriority(Priority.MEDIUM);
        }
        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public Page<Report> getReportsPaged(
            String category,
            String status,
            String priority,
            Long departmentId,
            String search,
            Pageable pageable) {

        Specification<Report> spec = (root, query, cb) -> cb.conjunction();

        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
        }

        if (status != null && !status.isBlank()) {
            ReportStatus reportStatus = ReportStatus.fromString(status);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), reportStatus));
        }

        if (priority != null && !priority.isBlank()) {
            Priority prio = Priority.fromString(priority);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), prio));
        }

        if (departmentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("department").get("id"), departmentId));
        }

        if (search != null && !search.isBlank()) {
            String term = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), term),
                    cb.like(cb.lower(root.get("description")), term),
                    cb.like(cb.lower(root.get("address")), term)
            ));
        }

        return reportRepository.findAll(spec, pageable);
    }

    public List<Report> getReportsByUser(User user) {
        return reportRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Report> getReportsForStaff(User staff) {
        if (staff.getRole() != Role.MUNICIPAL_STAFF && staff.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only staff and administrators can access staff queues");
        }

        if (staff.getDepartment() != null) {
            return reportRepository.findStaffQueue(staff, staff.getDepartment());
        }

        return reportRepository.findByAssignedStaffOrderByCreatedAtDesc(staff);
    }

    public List<Report> getStaffAssignedReports(User staff) {
        return getReportsForStaff(staff);
    }

    public Report getStaffReportById(Long id, User staff) {
        Report report = getReportById(id);

        if (staff.getRole() == Role.ADMIN) {
            return report;
        }

        if (staff.getRole() != Role.MUNICIPAL_STAFF) {
            throw new UnauthorizedActionException("Only municipal staff and administrators can access staff complaint views");
        }

        boolean isAssignedDirectly = report.getAssignedStaff() != null &&
                report.getAssignedStaff().getId().equals(staff.getId());
        boolean isStaffDepartment = report.getDepartment() != null &&
                staff.getDepartment() != null &&
                report.getDepartment().getId().equals(staff.getDepartment().getId());

        if (!isAssignedDirectly && !isStaffDepartment) {
            throw new UnauthorizedActionException("This complaint is not assigned to you or your department");
        }

        return report;
    }

    public Report getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
    }

    public Report getReportByIdAuthorized(Long id, User currentUser) {
        Report report = getReportById(id);

        if (currentUser.getRole() == Role.ADMIN) {
            return report;
        }

        if (currentUser.getRole() == Role.CITIZEN) {
            if (report.getUser() == null || !report.getUser().getId().equals(currentUser.getId())) {
                throw new UnauthorizedActionException("You are not authorized to view this report");
            }
            return report;
        }

        if (currentUser.getRole() == Role.MUNICIPAL_STAFF) {
            boolean isAssignedStaff = report.getAssignedStaff() != null &&
                    report.getAssignedStaff().getId().equals(currentUser.getId());
            boolean isStaffDepartment = report.getDepartment() != null &&
                    currentUser.getDepartment() != null &&
                    report.getDepartment().getId().equals(currentUser.getDepartment().getId());

            if (!isAssignedStaff && !isStaffDepartment) {
                throw new UnauthorizedActionException("This report is not assigned to you or your department");
            }
            return report;
        }

        throw new UnauthorizedActionException("Access denied");
    }

    @Transactional
    public Report updateStatus(Long id, String statusStr, String remarks, User currentUser) {
        Report report = getReportById(id);

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.MUNICIPAL_STAFF) {
            throw new UnauthorizedActionException("Only administrators and municipal staff can update complaint status");
        }

        if (currentUser.getRole() == Role.MUNICIPAL_STAFF) {
            boolean isAssignedStaff = report.getAssignedStaff() != null &&
                    report.getAssignedStaff().getId().equals(currentUser.getId());
            boolean isStaffDepartment = report.getDepartment() != null &&
                    currentUser.getDepartment() != null &&
                    report.getDepartment().getId().equals(currentUser.getDepartment().getId());

            if (!isAssignedStaff && !isStaffDepartment) {
                throw new UnauthorizedActionException("Staff can only update complaints assigned to them or their department");
            }
        }

        ReportStatus previousStatus = report.getStatus();
        ReportStatus newStatus = ReportStatus.fromString(statusStr);

        report.setStatus(newStatus);
        if (newStatus == ReportStatus.RESOLVED) {
            report.setResolvedAt(LocalDateTime.now());
        } else if (previousStatus == ReportStatus.RESOLVED && newStatus != ReportStatus.RESOLVED) {
            report.setResolvedAt(null);
        }

        Report saved = reportRepository.save(report);

        String remarkText = (remarks != null && !remarks.isBlank())
                ? remarks.trim()
                : "Status changed from " + previousStatus + " to " + newStatus;

        ReportStatusHistory history = new ReportStatusHistory(
                saved,
                previousStatus,
                newStatus,
                currentUser,
                remarkText
        );
        historyRepository.save(history);

        // Generate notification for citizen
        if (saved.getUser() != null) {
            NotificationType notifType;
            String notifTitle;

            if (newStatus == ReportStatus.RESOLVED) {
                notifType = NotificationType.COMPLAINT_RESOLVED;
                notifTitle = "Complaint Resolved";
            } else if (newStatus == ReportStatus.REJECTED) {
                notifType = NotificationType.COMPLAINT_REJECTED;
                notifTitle = "Complaint Rejected";
            } else if (newStatus == ReportStatus.IN_PROGRESS) {
                notifType = NotificationType.STATUS_CHANGED;
                notifTitle = "Complaint In Progress";
            } else {
                notifType = NotificationType.STATUS_CHANGED;
                notifTitle = "Complaint Status Updated";
            }

            notificationService.sendNotification(
                    saved.getUser(),
                    notifTitle,
                    "Status for your complaint #" + saved.getId() + " ('" + saved.getTitle() + "') was updated to " +
                            newStatus + ". Remarks: " + remarkText,
                    notifType,
                    saved
            );
        }

        return saved;
    }

    // Preserved for backward compatibility
    @Transactional
    public Report updateStatus(Long id, String status) {
        return updateStatus(id, status, null, userRepository.findByEmail("admin@civiclens.gov").orElse(null));
    }

    @Transactional
    public Report updateStaffProgress(Long id, StaffUpdateRequest request, User staff) {
        Report report = getReportById(id);

        if (staff.getRole() != Role.MUNICIPAL_STAFF && staff.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only municipal staff and administrators can post progress updates");
        }

        if (staff.getRole() == Role.MUNICIPAL_STAFF) {
            boolean isAssignedStaff = report.getAssignedStaff() != null &&
                    report.getAssignedStaff().getId().equals(staff.getId());
            boolean isStaffDepartment = report.getDepartment() != null &&
                    staff.getDepartment() != null &&
                    report.getDepartment().getId().equals(staff.getDepartment().getId());

            if (!isAssignedStaff && !isStaffDepartment) {
                throw new UnauthorizedActionException("Staff can only update complaints assigned to them or their department");
            }
        }

        ReportStatus prevStatus = report.getStatus();
        ReportStatus newStatus = ReportStatus.fromString(request.getStatus());

        // Validate status transition
        if (prevStatus == ReportStatus.RESOLVED && newStatus != ReportStatus.RESOLVED && staff.getRole() != Role.ADMIN) {
            throw new InvalidOperationException("Cannot reopen an already resolved complaint without administrator approval");
        }

        report.setStatus(newStatus);
        if (newStatus == ReportStatus.RESOLVED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        Report saved = reportRepository.save(report);

        String remarks = request.getRemarks() != null && !request.getRemarks().isBlank()
                ? request.getRemarks().trim()
                : (request.getNotes() != null ? request.getNotes().trim() : "Progress updated by staff " + staff.getName());

        ReportStatusHistory history = new ReportStatusHistory(
                saved,
                prevStatus,
                newStatus,
                staff,
                remarks,
                request.getProofImageUrl()
        );
        historyRepository.save(history);

        // Notify citizen
        if (saved.getUser() != null) {
            NotificationType type = (newStatus == ReportStatus.RESOLVED)
                    ? NotificationType.COMPLAINT_RESOLVED
                    : NotificationType.PROGRESS_UPDATE;

            String title = (newStatus == ReportStatus.RESOLVED)
                    ? "Complaint Resolved!"
                    : "Complaint Progress Update";

            notificationService.sendNotification(
                    saved.getUser(),
                    title,
                    "Staff member " + staff.getName() + " updated your complaint #" + saved.getId() +
                            " to " + newStatus + ". Remarks: " + remarks,
                    type,
                    saved
            );
        }

        return saved;
    }

    @Transactional
    public Report updatePriority(Long id, String priorityStr, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can update complaint priorities");
        }

        Report report = getReportById(id);
        Priority newPriority = Priority.fromString(priorityStr);
        report.setPriority(newPriority);

        return reportRepository.save(report);
    }

    @Transactional
    public Report assignDepartmentAndStaff(Long id, AssignReportRequest request, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can assign departments and staff");
        }

        Report report = getReportById(id);

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        report.setDepartment(department);

        User assignedStaff = null;
        boolean isReassignment = false;

        if (request.getAssignedStaffId() != null) {
            assignedStaff = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + request.getAssignedStaffId()));

            if (assignedStaff.getRole() != Role.MUNICIPAL_STAFF && assignedStaff.getRole() != Role.ADMIN) {
                throw new InvalidOperationException("Assigned user must have MUNICIPAL_STAFF or ADMIN role");
            }

            // Requirement: Validate staff belongs to selected department
            if (assignedStaff.getDepartment() != null && !assignedStaff.getDepartment().getId().equals(department.getId())) {
                throw new InvalidOperationException("Staff member '" + assignedStaff.getName() +
                        "' does not belong to department '" + department.getName() + "'");
            }

            if (report.getAssignedStaff() != null && !report.getAssignedStaff().getId().equals(assignedStaff.getId())) {
                isReassignment = true;
            }

            report.setAssignedStaff(assignedStaff);
        }

        // Auto-progress from PENDING to ASSIGNED if currently PENDING
        ReportStatus prevStatus = report.getStatus();
        if (report.getStatus() == ReportStatus.PENDING) {
            report.setStatus(ReportStatus.ASSIGNED);
        }

        Report saved = reportRepository.save(report);

        String remarks = (request.getRemarks() != null && !request.getRemarks().isBlank())
                ? request.getRemarks().trim()
                : "Assigned to department: " + department.getName() +
                (assignedStaff != null ? " (Staff: " + assignedStaff.getName() + ")" : "");

        ReportStatusHistory history = new ReportStatusHistory(
                saved,
                prevStatus,
                saved.getStatus(),
                admin,
                remarks
        );
        historyRepository.save(history);

        // Generate notifications:
        // 1. Notify assigned staff
        if (assignedStaff != null) {
            NotificationType staffType = isReassignment ? NotificationType.COMPLAINT_REASSIGNED : NotificationType.COMPLAINT_ASSIGNED;
            notificationService.sendNotification(
                    assignedStaff,
                    "New Task Assigned",
                    "Complaint #" + saved.getId() + " ('" + saved.getTitle() + "') has been assigned to you in " + department.getName(),
                    staffType,
                    saved
            );
        }

        // 2. Notify citizen
        if (saved.getUser() != null) {
            notificationService.sendNotification(
                    saved.getUser(),
                    "Complaint Assigned",
                    "Your complaint #" + saved.getId() + " has been assigned to department '" + department.getName() +
                            "'" + (assignedStaff != null ? " (Staff: " + assignedStaff.getName() + ")" : "") + ".",
                    NotificationType.COMPLAINT_ASSIGNED,
                    saved
            );
        }

        return saved;
    }

    @Transactional
    public void deleteReport(Long id, User currentUser) {
        Report report = getReportById(id);

        if (currentUser.getRole() == Role.ADMIN) {
            reportRepository.delete(report);
            return;
        }

        if (currentUser.getRole() == Role.CITIZEN) {
            if (report.getUser() == null || !report.getUser().getId().equals(currentUser.getId())) {
                throw new UnauthorizedActionException("You can only delete your own complaints");
            }

            if (report.getStatus() != ReportStatus.PENDING) {
                throw new InvalidOperationException(
                        "Complaints can only be deleted while in PENDING status. Current status is " + report.getStatus()
                );
            }

            reportRepository.delete(report);
            return;
        }

        throw new UnauthorizedActionException("Municipal staff are not authorized to delete complaints");
    }

    // Preserved for backward compatibility
    @Transactional
    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id)) {
            throw new ResourceNotFoundException("Report not found with ID: " + id);
        }
        reportRepository.deleteById(id);
    }

    public List<ReportStatusHistory> getStatusHistory(Long reportId, User currentUser) {
        Report report = getReportByIdAuthorized(reportId, currentUser);
        return historyRepository.findByReportOrderByTimestampDesc(report);
    }
}
