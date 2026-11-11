package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.dto.FileUploadResponse;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.UserRepository;
import com.civiclens.civiclens.service.FileUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
public class FileUploadController {

    private final FileUploadService fileUploadService;
    private final UserRepository userRepository;

    public FileUploadController(FileUploadService fileUploadService, UserRepository userRepository) {
        this.fileUploadService = fileUploadService;
        this.userRepository = userRepository;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "complaints") String folder,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(FileUploadResponse.failure("Authentication is required to upload files"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));

        FileUploadResponse response = fileUploadService.storeFile(file, folder, user);

        return ResponseEntity.ok(response);
    }
}
