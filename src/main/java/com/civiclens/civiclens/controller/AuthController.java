package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.config.JwtUtil;
import com.civiclens.civiclens.dto.ApiResponse;
import com.civiclens.civiclens.dto.CreateStaffRequest;
import com.civiclens.civiclens.dto.RegisterRequest;
import com.civiclens.civiclens.model.JwtResponse;
import com.civiclens.civiclens.model.LoginRequest;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User registered = userService.registerCitizen(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(registered);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.login(request.getEmail(), request.getPassword());

        String roleName = user.getRole() != null ? user.getRole().name() : "CITIZEN";
        String token = jwtUtil.generateToken(user.getEmail(), roleName, user.getId());

        JwtResponse response = new JwtResponse(
                token,
                roleName,
                user.getEmail(),
                user.getName(),
                user.getId()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-staff")
    public ResponseEntity<?> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        User staff = userService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(staff);
    }
}
