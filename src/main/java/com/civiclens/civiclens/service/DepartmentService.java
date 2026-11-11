package com.civiclens.civiclens.service;

import com.civiclens.civiclens.exception.InvalidOperationException;
import com.civiclens.civiclens.exception.ResourceNotFoundException;
import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.ReportStatus;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentService.class);

    private final DepartmentRepository departmentRepository;
    private final ReportRepository reportRepository;

    public DepartmentService(DepartmentRepository departmentRepository, ReportRepository reportRepository) {
        this.departmentRepository = departmentRepository;
        this.reportRepository = reportRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAllByOrderByNameAsc();
    }

    public List<Department> getActiveDepartments() {
        return departmentRepository.findByActiveTrue();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
    }

    @Transactional
    public Department createDepartment(Department department) {
        String name = department.getName() != null ? department.getName().trim() : department.getDepartmentName();
        if (name == null || name.isBlank()) {
            throw new InvalidOperationException("Department name cannot be blank");
        }

        if (departmentRepository.existsByName(name)) {
            throw new InvalidOperationException("Department with name '" + name + "' already exists");
        }

        department.setName(name);
        if (department.getActive() == null) {
            department.setActive(true);
        }

        return departmentRepository.save(department);
    }

    @Transactional
    public Department updateDepartment(Long id, Department updateData) {
        Department department = getDepartmentById(id);

        String newName = updateData.getName() != null ? updateData.getName().trim() : updateData.getDepartmentName();
        if (newName != null && !newName.isBlank() && !newName.equalsIgnoreCase(department.getName())) {
            if (departmentRepository.existsByName(newName)) {
                throw new InvalidOperationException("Another department with name '" + newName + "' already exists");
            }
            department.setName(newName);
        }

        if (updateData.getDescription() != null) {
            department.setDescription(updateData.getDescription().trim());
        }
        if (updateData.getContactEmail() != null) {
            department.setContactEmail(updateData.getContactEmail().trim());
        }
        if (updateData.getContactPhone() != null) {
            department.setContactPhone(updateData.getContactPhone().trim());
        }
        if (updateData.getActive() != null) {
            department.setActive(updateData.getActive());
        }

        return departmentRepository.save(department);
    }

    @Transactional
    public String deleteOrDeactivateDepartment(Long id) {
        Department department = getDepartmentById(id);

        long activeComplaints = reportRepository.countByDepartmentAndStatusNotIn(
                department,
                List.of(ReportStatus.RESOLVED, ReportStatus.REJECTED)
        );

        if (activeComplaints > 0) {
            // Cannot physically delete because active complaints depend on it; deactivate instead
            department.setActive(false);
            departmentRepository.save(department);
            return "Department has " + activeComplaints + " active complaints. It has been deactivated instead of deleted.";
        }

        boolean hasAnyComplaints = reportRepository.existsByDepartment(department);
        if (hasAnyComplaints) {
            department.setActive(false);
            departmentRepository.save(department);
            return "Department is referenced by historical complaints. It has been deactivated.";
        }

        departmentRepository.delete(department);
        return "Department deleted successfully";
    }

    @PostConstruct
    @Transactional
    public void initDefaultDepartments() {
        if (departmentRepository.count() == 0) {
            log.info("Seeding default municipal departments...");
            List<Department> defaults = List.of(
                    new Department("Roads & Traffic", "Maintenance of public roads, potholes, signals, and signage", "roads@civiclens.gov", "1800-111-001"),
                    new Department("Streetlight & Electricity", "Repair of public streetlights, electrical wiring, and illumination", "electricity@civiclens.gov", "1800-111-002"),
                    new Department("Sanitation & Waste", "Garbage collection, street sweeping, and waste disposal", "sanitation@civiclens.gov", "1800-111-003"),
                    new Department("Water Supply", "Potable water supply, pipe leaks, and water quality", "water@civiclens.gov", "1800-111-004"),
                    new Department("Drainage & Sewage", "Stormwater drains, sewer blockages, and overflow control", "drainage@civiclens.gov", "1800-111-005"),
                    new Department("Public Health & Safety", "General civic safety, hazardous structures, and public sanitation", "safety@civiclens.gov", "1800-111-006")
            );
            departmentRepository.saveAll(defaults);
            log.info("Default municipal departments seeded successfully.");
        }
    }
}
