package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByUser(User user);

    List<Report> findByStatus(String status);

    List<Report> findByCategory(String category);
}