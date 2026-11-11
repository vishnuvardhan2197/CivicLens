package com.civiclens.civiclens.dto;

import jakarta.validation.constraints.NotBlank;

public class StaffUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String remarks;

    private String proofImageUrl;

    private String notes;

    public StaffUpdateRequest() {
    }

    public StaffUpdateRequest(String status, String remarks, String proofImageUrl) {
        this.status = status;
        this.remarks = remarks;
        this.proofImageUrl = proofImageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
