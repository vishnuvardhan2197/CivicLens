package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.dto.ApiResponse;
import com.civiclens.civiclens.dto.CreateStaffRequest;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    private User getAdmin(Authentication authentication) {
        return userService.findByEmail(authentication.getName());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Role parsedRole = (role != null && !role.isBlank()) ? Role.fromString(role) : null;
        Page<User> users = userService.getUsersFiltered(parsedRole, active, search, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/staff")
    public ResponseEntity<User> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        User staff = userService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(staff);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String role = body.get("role");
        User admin = getAdmin(authentication);
        User updated = userService.updateUserRole(id, role, admin);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            Authentication authentication) {

        Boolean active = body.get("active");
        if (active == null) {
            active = true;
        }
        User admin = getAdmin(authentication);
        User updated = userService.updateUserStatus(id, active, admin);
        return ResponseEntity.ok(updated);
    }
}
