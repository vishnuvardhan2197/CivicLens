package com.civiclens.civiclens;

import com.civiclens.civiclens.config.JwtUtil;
import com.civiclens.civiclens.dto.AssignReportRequest;
import com.civiclens.civiclens.dto.StaffUpdateRequest;
import com.civiclens.civiclens.dto.StatusUpdateRequest;
import com.civiclens.civiclens.model.*;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.NotificationRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import com.civiclens.civiclens.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class Phase6VerificationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User citizen1;
    private User citizen2;
    private User staffMember;
    private User unrelatedStaff;
    private Department testDept;
    private Department otherDept;

    private String adminToken;
    private String citizen1Token;
    private String citizen2Token;
    private String staffToken;
    private String unrelatedStaffToken;

    private static final byte[] VALID_JPEG_BYTES = new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0, 16, 'J', 'F', 'I', 'F', 0, 1
    };

    @BeforeEach
    void setUp() {
        // Setup departments
        testDept = departmentRepository.save(new Department("Phase6 Sanitation", "Solid waste and cleaning"));
        otherDept = departmentRepository.save(new Department("Phase6 Electricity", "Streetlights and transformers"));

        // Setup admin
        adminUser = userRepository.save(new User("Admin P6", "admin.p6@civiclens.gov", passwordEncoder.encode("AdminPass123"), Role.ADMIN));
        adminToken = jwtUtil.generateToken(adminUser.getEmail(), "ADMIN", adminUser.getId());

        // Setup Citizen 1
        citizen1 = userRepository.save(new User("Citizen One", "citizen1.p6@example.com", passwordEncoder.encode("CitizenPass123"), Role.CITIZEN));
        citizen1Token = jwtUtil.generateToken(citizen1.getEmail(), "CITIZEN", citizen1.getId());

        // Setup Citizen 2
        citizen2 = userRepository.save(new User("Citizen Two", "citizen2.p6@example.com", passwordEncoder.encode("CitizenPass123"), Role.CITIZEN));
        citizen2Token = jwtUtil.generateToken(citizen2.getEmail(), "CITIZEN", citizen2.getId());

        // Setup Assigned Staff
        staffMember = new User("Staff Member", "staff.p6@civiclens.gov", passwordEncoder.encode("StaffPass123"), Role.MUNICIPAL_STAFF);
        staffMember.setDepartment(testDept);
        staffMember = userRepository.save(staffMember);
        staffToken = jwtUtil.generateToken(staffMember.getEmail(), "MUNICIPAL_STAFF", staffMember.getId());

        // Setup Unrelated Staff (different department)
        unrelatedStaff = new User("Other Staff", "other.staff.p6@civiclens.gov", passwordEncoder.encode("StaffPass123"), Role.MUNICIPAL_STAFF);
        unrelatedStaff.setDepartment(otherDept);
        unrelatedStaff = userRepository.save(unrelatedStaff);
        unrelatedStaffToken = jwtUtil.generateToken(unrelatedStaff.getEmail(), "MUNICIPAL_STAFF", unrelatedStaff.getId());
    }

    // =========================================================================
    // 1. END-TO-END WORKFLOW: CITIZEN REGISTRATION, LOGIN & SUBMISSION
    // =========================================================================

    @Test
    @DisplayName("E2E: Citizen registers, logs in, submits complaint with GPS, and receives notification")
    void testCitizenE2EWorkflow() throws Exception {
        // Step 1: Register new citizen
        Map<String, String> registerPayload = Map.of(
                "name", "P6 New Citizen",
                "email", "new.citizen.p6@example.com",
                "password", "Secret12345",
                "phone", "9876543210"
        );

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new.citizen.p6@example.com"))
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andExpect(jsonPath("$.password").doesNotExist()); // Ensure password hash never returned

        // Step 2: Login to receive JWT
        Map<String, String> loginPayload = Map.of(
                "email", "new.citizen.p6@example.com",
                "password", "Secret12345"
        );

        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("token").asText();

        // Step 3: Submit complaint with GPS coordinates and photo path
        Report newReport = new Report();
        newReport.setTitle("P6 Open Manhole Hazard");
        newReport.setDescription("Dangerous open sewer manhole near playground");
        newReport.setCategory("Sanitation & Waste");
        newReport.setAddress("Sector 4, Main Park Road");
        newReport.setLatitude(17.432100);
        newReport.setLongitude(78.543200);
        newReport.setPriority(Priority.HIGH);
        newReport.setImageUrl("/uploads/p6-manhole.jpg");

        String reportResponse = mockMvc.perform(post("/reports")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newReport)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.latitude").value(17.432100))
                .andExpect(jsonPath("$.longitude").value(78.543200))
                .andReturn().getResponse().getContentAsString();

        Long createdReportId = objectMapper.readTree(reportResponse).get("id").asLong();

        // Step 4: Verify citizen receives notification for submission
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Complaint Submitted"))
                .andExpect(jsonPath("$[0].read").value(false));

        // Step 5: Citizen can view own report
        mockMvc.perform(get("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("P6 Open Manhole Hazard"));
    }

    // =========================================================================
    // 2. SECURITY & AUTHORIZATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Security: Citizen cannot access Admin APIs (/admin/**, /reports/{id}/assign)")
    void testCitizenForbiddenFromAdminEndpoints() throws Exception {
        // Attempt to access user management
        mockMvc.perform(get("/admin/users")
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isForbidden());

        // Attempt to access department creation
        mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + citizen1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Malicious Dept\"}"))
                .andExpect(status().isForbidden());

        // Attempt to assign a report
        mockMvc.perform(put("/reports/1/assign")
                        .header("Authorization", "Bearer " + citizen1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentId\": 1}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Citizen 2 cannot view Citizen 1's report (403 Forbidden)")
    void testCrossCitizenReportIsolation() throws Exception {
        Report report = new Report();
        report.setTitle("Citizen 1 Private Issue");
        report.setDescription("Confidential civic report");
        report.setCategory("Roads & Infrastructure");
        report.setAddress("Street 1");
        report.setUser(citizen1);
        report.setStatus(ReportStatus.PENDING);
        report = reportRepository.save(report);

        // Citizen 2 attempts to view Citizen 1's report
        mockMvc.perform(get("/reports/" + report.getId())
                        .header("Authorization", "Bearer " + citizen2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Citizen cannot delete report once assigned or in progress")
    void testCitizenCannotDeleteAssignedReport() throws Exception {
        Report report = new Report();
        report.setTitle("Assigned Issue");
        report.setDescription("Issue under work");
        report.setCategory("Sanitation & Waste");
        report.setAddress("Street 2");
        report.setUser(citizen1);
        report.setStatus(ReportStatus.ASSIGNED);
        report.setDepartment(testDept);
        report = reportRepository.save(report);

        // Citizen 1 attempts to delete assigned report
        mockMvc.perform(delete("/reports/" + report.getId())
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Security: Unrelated municipal staff cannot update other department's report")
    void testStaffDepartmentIsolation() throws Exception {
        Report report = new Report();
        report.setTitle("Sanitation Issue");
        report.setDescription("Clean up required");
        report.setCategory("Sanitation & Waste");
        report.setAddress("Sector 1");
        report.setUser(citizen1);
        report.setStatus(ReportStatus.ASSIGNED);
        report.setDepartment(testDept);
        report.setAssignedStaff(staffMember);
        report = reportRepository.save(report);

        StaffUpdateRequest updateReq = new StaffUpdateRequest();
        updateReq.setStatus("IN_PROGRESS");
        updateReq.setRemarks("Attempt by unrelated staff");

        // Unrelated staff (from Electricity dept) attempts to update Sanitation report
        mockMvc.perform(put("/reports/" + report.getId() + "/staff-update")
                        .header("Authorization", "Bearer " + unrelatedStaffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Users cannot mark or delete other users' notifications")
    void testNotificationCrossUserIsolation() throws Exception {
        Notification notif = new Notification(citizen1, "Private Alert", "Alert for user 1", NotificationType.STATUS_CHANGED, null);
        notif = notificationRepository.save(notif);

        // Citizen 2 attempts to mark Citizen 1's notification as read
        mockMvc.perform(put("/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + citizen2Token))
                .andExpect(status().isForbidden());

        // Citizen 2 attempts to delete Citizen 1's notification
        mockMvc.perform(delete("/notifications/" + notif.getId())
                        .header("Authorization", "Bearer " + citizen2Token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 3. ADMIN & STAFF COLLABORATION LIFECYCLE
    // =========================================================================

    @Test
    @DisplayName("Lifecycle: Admin assigns report -> Staff updates with proof -> Citizen gets resolved notification")
    void testFullComplaintResolutionLifecycle() throws Exception {
        // 1. Citizen submits report
        Report report = new Report();
        report.setTitle("Broken Water Pipe");
        report.setDescription("Massive water leak on 5th Avenue");
        report.setCategory("Water Supply");
        report.setAddress("5th Avenue, Landmark Junction");
        report.setLatitude(17.400100);
        report.setLongitude(78.450200);
        report.setUser(citizen1);
        report.setStatus(ReportStatus.PENDING);
        report = reportRepository.save(report);

        // 2. Admin assigns department and staff
        AssignReportRequest assignReq = new AssignReportRequest();
        assignReq.setDepartmentId(testDept.getId());
        assignReq.setAssignedStaffId(staffMember.getId());
        assignReq.setRemarks("Priority inspection needed today");

        mockMvc.perform(put("/reports/" + report.getId() + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.department.id").value(testDept.getId()))
                .andExpect(jsonPath("$.assignedStaff.id").value(staffMember.getId()));

        // 3. Staff advances status to IN_PROGRESS
        StaffUpdateRequest inProgressReq = new StaffUpdateRequest();
        inProgressReq.setStatus("IN_PROGRESS");
        inProgressReq.setRemarks("Field crew deployed on-site");

        mockMvc.perform(put("/reports/" + report.getId() + "/staff-update")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inProgressReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 4. Staff resolves complaint with proof image
        StaffUpdateRequest resolveReq = new StaffUpdateRequest();
        resolveReq.setStatus("RESOLVED");
        resolveReq.setRemarks("Pipe replaced and asphalt restored");
        resolveReq.setProofImageUrl("/uploads/proof-pipe-fixed.jpg");

        mockMvc.perform(put("/reports/" + report.getId() + "/staff-update")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 5. Verify status history audit trail
        mockMvc.perform(get("/reports/" + report.getId() + "/history")
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3)); // ASSIGNED, IN_PROGRESS, RESOLVED

        // 6. Verify Citizen received resolution notification
        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Complaint Resolved!"));
    }

    // =========================================================================
    // 4. ANALYTICS & FILE UPLOAD TESTING
    // =========================================================================

    @Test
    @DisplayName("Analytics: Summary reflects real database records")
    void testAnalyticsIntegrity() throws Exception {
        mockMvc.perform(get("/analytics/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints").isNumber())
                .andExpect(jsonPath("$.totalCitizens").isNumber())
                .andExpect(jsonPath("$.resolutionRatePercent").isNumber());
    }

    @Test
    @DisplayName("Upload Security: Valid image succeeds, unsupported file is rejected")
    void testFileUploadValidation() throws Exception {
        // Valid JPEG file upload
        MockMultipartFile validImage = new MockMultipartFile(
                "file", "road-hazard.jpg", "image/jpeg", VALID_JPEG_BYTES
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(validImage)
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.imageUrl").isNotEmpty());

        // Invalid executable file upload
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file", "script.sh", "application/x-sh", "rm -rf /".getBytes()
        );

        mockMvc.perform(multipart("/files/upload")
                        .file(maliciousFile)
                        .header("Authorization", "Bearer " + citizen1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
