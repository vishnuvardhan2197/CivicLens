package com.civiclens.civiclens.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_status_history")
public class ReportStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    @JsonIgnoreProperties({"user", "statusHistory", "department", "assignedStaff"})
    private Report report;

    @Enumerated(EnumType.STRING)
    private ReportStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus newStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by_user_id")
    @JsonIgnoreProperties({"password", "reports", "department"})
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "proof_image_url")
    private String proofImageUrl;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public ReportStatusHistory() {
    }

    public ReportStatusHistory(Report report, ReportStatus previousStatus, ReportStatus newStatus, User changedBy, String remarks) {
        this.report = report;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.remarks = remarks;
        this.timestamp = LocalDateTime.now();
    }

    public ReportStatusHistory(Report report, ReportStatus previousStatus, ReportStatus newStatus, User changedBy, String remarks, String proofImageUrl) {
        this.report = report;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.remarks = remarks;
        this.proofImageUrl = proofImageUrl;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Report getReport() {
        return report;
    }

    public void setReport(Report report) {
        this.report = report;
    }

    public ReportStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(ReportStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public ReportStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ReportStatus newStatus) {
        this.newStatus = newStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    // Alias for updatedBy
    public User getUpdatedBy() {
        return changedBy;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    // Alias for createdAt
    public LocalDateTime getCreatedAt() {
        return timestamp;
    }
}
