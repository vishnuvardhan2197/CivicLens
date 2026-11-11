package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.ReportStatus;
import com.civiclens.civiclens.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    List<Report> findByUser(User user);

    List<Report> findByUserOrderByCreatedAtDesc(User user);

    List<Report> findAllByOrderByCreatedAtDesc();

    Page<Report> findAll(Pageable pageable);

    List<Report> findByStatus(ReportStatus status);

    List<Report> findByCategory(String category);

    List<Report> findByDepartmentOrderByCreatedAtDesc(Department department);

    List<Report> findByAssignedStaffOrderByCreatedAtDesc(User staff);

    @Query("SELECT r FROM Report r WHERE r.assignedStaff = :staff OR (r.department = :department AND r.assignedStaff IS NULL) ORDER BY r.createdAt DESC")
    List<Report> findStaffQueue(@Param("staff") User staff, @Param("department") Department department);

    boolean existsByDepartment(Department department);

    long countByDepartmentAndStatusNotIn(Department department, List<ReportStatus> statuses);

    long countByStatus(ReportStatus status);

    @Query("SELECT r.category, COUNT(r) FROM Report r GROUP BY r.category")
    List<Object[]> countReportsByCategory();

    @Query("SELECT COALESCE(r.department.name, 'Unassigned'), COUNT(r) FROM Report r GROUP BY r.department.name")
    List<Object[]> countReportsByDepartment();

    @Query("SELECT r.status, COUNT(r) FROM Report r GROUP BY r.status")
    List<Object[]> countReportsByStatus();

    @Query("SELECT r FROM Report r WHERE r.status = 'RESOLVED' AND r.resolvedAt IS NOT NULL AND r.createdAt IS NOT NULL")
    List<Report> findResolvedReportsWithTimestamps();
}
