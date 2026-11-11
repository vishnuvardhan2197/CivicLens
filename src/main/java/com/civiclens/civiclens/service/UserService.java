package com.civiclens.civiclens.service;

import com.civiclens.civiclens.dto.CreateStaffRequest;
import com.civiclens.civiclens.dto.RegisterRequest;
import com.civiclens.civiclens.exception.EmailAlreadyExistsException;
import com.civiclens.civiclens.exception.InvalidOperationException;
import com.civiclens.civiclens.exception.ResourceNotFoundException;
import com.civiclens.civiclens.exception.UnauthorizedActionException;
import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${civiclens.admin.email:admin@civiclens.gov}")
    private String adminEmail;

    @Value("${civiclens.admin.password:Admin@12345}")
    private String adminPassword;

    @Value("${civiclens.admin.name:System Administrator}")
    private String adminName;

    public UserService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerCitizen(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("An account with email '" + normalizedEmail + "' already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.CITIZEN);
        user.setPhone(request.getPhone());
        user.setActive(true);

        return userRepository.save(user);
    }

    // Preserved for backward compatibility
    @Transactional
    public User register(User user) {
        String normalizedEmail = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : null;
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("An account with email '" + normalizedEmail + "' already exists");
        }

        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.CITIZEN);
        user.setActive(true);

        return userRepository.save(user);
    }

    @Transactional
    public User createStaff(CreateStaffRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("An account with email '" + normalizedEmail + "' already exists");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        User staff = new User();
        staff.setName(request.getName().trim());
        staff.setEmail(normalizedEmail);
        staff.setPassword(passwordEncoder.encode(request.getPassword()));
        staff.setRole(Role.MUNICIPAL_STAFF);
        staff.setDepartment(department);
        staff.setPhone(request.getPhone());
        staff.setActive(true);

        return userRepository.save(staff);
    }

    public User login(String email, String password) {
        if (email == null || password == null) {
            throw new BadCredentialsException("Email and password are required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Your account has been deactivated. Please contact an administrator.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return user;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email != null ? email.trim().toLowerCase() : null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    public List<User> getStaffByDepartment(Long departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));
        return userRepository.findByDepartment(department);
    }

    public List<User> getAllStaff() {
        return userRepository.findByRole(Role.MUNICIPAL_STAFF);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getUsersFiltered(Role role, Boolean active, String search, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();

        if (role != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }

        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }

        if (search != null && !search.isBlank()) {
            String term = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), term),
                    cb.like(cb.lower(root.get("email")), term),
                    cb.like(cb.lower(root.get("phone")), term)
            ));
        }

        Page<User> users = userRepository.findAll(spec, pageable);
        return users;
    }

    @Transactional
    public User updateUserRole(Long id, String roleStr, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can change user roles");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        Role newRole = Role.fromString(roleStr);

        // Guard: Prevent demoting the last active administrator
        if (user.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndActiveTrue(Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new InvalidOperationException("Cannot revoke admin privileges from the last active administrator account");
            }
        }

        user.setRole(newRole);
        return userRepository.save(user);
    }

    @Transactional
    public User updateUserStatus(Long id, boolean active, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can change user active status");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Guard: Prevent deactivating the last active administrator
        if (user.getRole() == Role.ADMIN && !active) {
            long activeAdminCount = userRepository.countByRoleAndActiveTrue(Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new InvalidOperationException("Cannot deactivate the last active administrator account");
            }
        }

        user.setActive(active);
        return userRepository.save(user);
    }

    @PostConstruct
    @Transactional
    public void initAdmin() {
        String normalizedAdminEmail = adminEmail.trim().toLowerCase();
        if (!userRepository.existsByEmail(normalizedAdminEmail)) {
            log.info("Provisioning default administrator account: {}", normalizedAdminEmail);
            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(normalizedAdminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
            log.info("Default administrator account created successfully.");
        }
    }
}
