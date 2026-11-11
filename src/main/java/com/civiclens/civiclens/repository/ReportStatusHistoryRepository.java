package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.ReportStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportStatusHistoryRepository extends JpaRepository<ReportStatusHistory, Long> {

    List<ReportStatusHistory> findByReportOrderByTimestampDesc(Report report);
}
