package com.civiclens.civiclens.dto;

import jakarta.validation.constraints.NotNull;

public class AssignReportRequest {

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private Long assignedStaffId;

    private String remarks;

    public AssignReportRequest() {
    }

    public AssignReportRequest(Long departmentId, Long assignedStaffId, String remarks) {
        this.departmentId = departmentId;
        this.assignedStaffId = assignedStaffId;
        this.remarks = remarks;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
