package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByName(String name);

    boolean existsByName(String name);

    List<Department> findByActiveTrue();

    List<Department> findAllByOrderByNameAsc();
}
