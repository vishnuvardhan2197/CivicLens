package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
}