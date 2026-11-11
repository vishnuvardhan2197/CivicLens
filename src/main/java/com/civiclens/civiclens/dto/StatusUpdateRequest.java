package com.civiclens.civiclens.dto;

import jakarta.validation.constraints.NotBlank;

public class StatusUpdateRequest {

    @NotBlank(message = "Status cannot be blank")
    private String status;

    private String remarks;

    public StatusUpdateRequest() {
    }

    public StatusUpdateRequest(String status, String remarks) {
        this.status = status;
        this.remarks = remarks;
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
}
