package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.dto.ApiResponse;
import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<Department> getAllDepartments(@RequestParam(value = "activeOnly", required = false, defaultValue = "false") boolean activeOnly) {
        if (activeOnly) {
            return departmentService.getActiveDepartments();
        }
        return departmentService.getAllDepartments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody Department department) {
        Department created = departmentService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> updateDepartment(@PathVariable Long id, @RequestBody Department department) {
        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDepartment(@PathVariable Long id) {
        String result = departmentService.deleteOrDeactivateDepartment(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
