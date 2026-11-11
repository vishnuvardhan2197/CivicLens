package com.civiclens.civiclens.repository;

import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    long countByRole(Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.active = true")
    long countByRoleAndActiveTrue(@Param("role") Role role);

    List<User> findByDepartment(Department department);
}
