package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.config.JwtUtil;
import com.civiclens.civiclens.model.JwtResponse;
import com.civiclens.civiclens.model.LoginRequest;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userService.login(request.getEmail(), request.getPassword());

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(new JwtResponse(token));
    }
}