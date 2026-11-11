package com.civiclens.civiclens;

import com.civiclens.civiclens.dto.CreateStaffRequest;
import com.civiclens.civiclens.dto.FileUploadResponse;
import com.civiclens.civiclens.dto.RegisterRequest;
import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.LoginRequest;
import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import com.civiclens.civiclens.repository.UserRepository;
import com.civiclens.civiclens.service.FileUploadService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FileUploadIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private FileUploadService fileUploadService;

    private String citizenToken;
    private String staffToken;
    private String adminToken;
    private String uploadedImageUrl;
    private Long createdReportId;

    // Standard valid JPEG header bytes
    private static final byte[] VALID_JPEG_BYTES = new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0, 16, 'J', 'F', 'I', 'F', 0, 1
    };

    // Standard valid PNG header bytes
    private static final byte[] VALID_PNG_BYTES = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0, 0, 0, 13
    };

    @BeforeAll
    void setupUsers() throws Exception {
        // 1. Setup Citizen
        String citizenEmail = "uploader.citizen@civiclens.gov";
        if (!userRepository.existsByEmail(citizenEmail)) {
            RegisterRequest citizenReg = new RegisterRequest("Photo Citizen", citizenEmail, "Password@123", "9988776655");
            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(citizenReg)))
                    .andExpect(status().isCreated());
        }

        MvcResult citizenLoginRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(citizenEmail, "Password@123"))))
                .andExpect(status().isOk())
                .andReturn();
        citizenToken = objectMapper.readTree(citizenLoginRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Setup Admin
        MvcResult adminLoginRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin@civiclens.gov", "Admin@12345"))))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("token").asText();

        // 3. Setup Staff
        String staffEmail = "photo.staff@civiclens.gov";
        if (!userRepository.existsByEmail(staffEmail)) {
            Department dept = departmentRepository.findAll().get(0);
            CreateStaffRequest staffReq = new CreateStaffRequest();
            staffReq.setName("Field Inspector");
            staffReq.setEmail(staffEmail);
            staffReq.setPassword("StaffPass@123");
            staffReq.setDepartmentId(dept.getId());

            mockMvc.perform(post("/auth/create-staff")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(staffReq)))
                    .andExpect(status().isCreated());
        }

        MvcResult staffLoginRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(staffEmail, "StaffPass@123"))))
                .andExpect(status().isOk())
                .andReturn();
        staffToken = objectMapper.readTree(staffLoginRes.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(1)
    void test1_CitizenUploadsValidPhotograph() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "pothole_evidence.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        MvcResult result = mockMvc.perform(multipart("/files/upload")
                        .file(file)
                        .param("folder", "complaints")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.startsWith("/uploads/complaints/")))
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.endsWith(".jpg")))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        uploadedImageUrl = json.get("imageUrl").asText();
        assertNotNull(uploadedImageUrl);
    }

    @Test
    @Order(2)
    void test2_CitizenSubmitsComplaintWithUploadedPhoto() throws Exception {
        assertNotNull(uploadedImageUrl, "Image must have been uploaded in test 1");

        Report report = new Report();
        report.setTitle("Deep Pothole with Evidence");
        report.setDescription("Near main bus stand, causing traffic block");
        report.setCategory("Roads");
        report.setLatitude(12.9716);
        report.setLongitude(77.5946);
        report.setImageUrl(uploadedImageUrl);

        MvcResult result = mockMvc.perform(post("/reports")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(report)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.imageUrl").value(uploadedImageUrl))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        createdReportId = json.get("id").asLong();
    }

    @Test
    @Order(3)
    void test3_CitizenViewsComplaintWithPhotograph() throws Exception {
        assertNotNull(createdReportId);

        mockMvc.perform(get("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdReportId))
                .andExpect(jsonPath("$.imageUrl").value(uploadedImageUrl));

        // Also verify in /reports/my list
        mockMvc.perform(get("/reports/my")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + createdReportId + ")].imageUrl").value(uploadedImageUrl));
    }

    @Test
    @Order(4)
    void test4_VerifyDiskPersistenceAndStaticResourceServing() throws Exception {
        assertNotNull(uploadedImageUrl);

        // Verify physical file on disk
        String relativePath = uploadedImageUrl.replaceFirst("^/uploads/", "");
        Path physicalPath = fileUploadService.getRootStorageLocation().resolve(relativePath);

        assertTrue(Files.exists(physicalPath), "Physical file must exist on disk at " + physicalPath);
        assertTrue(Files.size(physicalPath) > 0, "Uploaded file must not be empty");

        // Verify file is accessible via GET /uploads/**
        mockMvc.perform(get(uploadedImageUrl))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=")));
    }

    @Test
    @Order(5)
    void test5_RejectExecutableAndForgedFiles() throws Exception {
        // Case A: Bash script with fake .jpg extension
        byte[] scriptBytes = "#!/bin/bash\necho 'malicious script'".getBytes();
        MockMultipartFile forgedJpg = new MockMultipartFile(
                "file",
                "exploit.jpg",
                "image/jpeg",
                scriptBytes
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(forgedJpg)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("File signature does not match")));

        // Case B: Executable extension
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                scriptBytes
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(exeFile)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Unsupported file extension")));
    }

    @Test
    @Order(6)
    void test6_RejectFileExceeding5MB() throws Exception {
        // Create 5.5 MB dummy byte array with valid JPEG header
        byte[] oversizedBytes = new byte[5 * 1024 * 1024 + 500 * 1024];
        System.arraycopy(VALID_JPEG_BYTES, 0, oversizedBytes, 0, VALID_JPEG_BYTES.length);

        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "huge_photo.jpg",
                "image/jpeg",
                oversizedBytes
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(oversizedFile)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 400 || status == 413, "Expected 400 or 413 but was " + status);
                });
    }

    @Test
    @Order(7)
    void test7_RejectUnauthenticatedUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "unauthorized.png",
                "image/png",
                VALID_PNG_BYTES
        );

        // Upload without Authorization header must be rejected
        mockMvc.perform(multipart("/files/upload")
                        .file(file))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 401 || status == 403, "Expected 401 or 403 but was " + status);
                });
    }

    @Test
    @Order(8)
    void test8_MunicipalStaffCanUploadProgressPhotographs() throws Exception {
        // Staff uploads to folder=progress
        MockMultipartFile progressPhoto = new MockMultipartFile(
                "file",
                "road_repair_progress.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(progressPhoto)
                        .param("folder", "progress")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.startsWith("/uploads/progress/")));

        // Ordinary citizen attempting to upload to folder=progress must be FORBIDDEN
        mockMvc.perform(multipart("/files/upload")
                        .file(progressPhoto)
                        .param("folder", "progress")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Only municipal staff and administrators")));
    }
}
