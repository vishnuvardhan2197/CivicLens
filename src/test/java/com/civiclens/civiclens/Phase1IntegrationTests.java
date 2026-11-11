package com.civiclens.civiclens;

import com.civiclens.civiclens.dto.AssignReportRequest;
import com.civiclens.civiclens.dto.CreateStaffRequest;
import com.civiclens.civiclens.dto.RegisterRequest;
import com.civiclens.civiclens.dto.ReportRequest;
import com.civiclens.civiclens.dto.StatusUpdateRequest;
import com.civiclens.civiclens.model.Department;
import com.civiclens.civiclens.model.LoginRequest;
import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.ReportStatus;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.DepartmentRepository;
import com.civiclens.civiclens.repository.ReportRepository;
import com.civiclens.civiclens.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase1IntegrationTests {

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

    private static String citizenToken;
    private static String adminToken;
    private static String staffToken;
    private static Long createdReportId;
    private static Long seededDepartmentId;

    @Test
    @Order(1)
    void verifyExistingDataPreserved() {
        // Clean up test users from previous test runs if any
        List.of("jane.citizen@example.com", "other.citizen@example.com", "ramesh.staff@civiclens.gov")
                .forEach(email -> userRepository.findByEmail(email).ifPresent(user -> {
                    reportRepository.findByUser(user).forEach(reportRepository::delete);
                    userRepository.delete(user);
                }));

        // Confirm all 7 legacy users and 9 legacy reports exist
        assertTrue(userRepository.count() >= 7, "Existing users must be preserved");
        assertTrue(reportRepository.count() >= 9, "Existing complaints must be preserved");

        // Verify departments are seeded
        List<Department> departments = departmentRepository.findAll();
        assertFalse(departments.isEmpty(), "Municipal departments must be seeded");
        seededDepartmentId = departments.get(0).getId();
    }

    @Test
    @Order(2)
    void testCitizenRegistrationAndDuplicateRejection() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "Jane Doe",
                "jane.citizen@example.com",
                "Password@123",
                "9876543210"
        );

        // 1. Initial registration should succeed with 201 Created
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("jane.citizen@example.com"))
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andExpect(jsonPath("$.password").doesNotExist());

        // 2. Duplicate registration with same email must fail with 409 Conflict
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @Order(3)
    void testAuthenticationAndJwtTokens() throws Exception {
        // Citizen login
        LoginRequest citizenLogin = new LoginRequest("jane.citizen@example.com", "Password@123");
        MvcResult citizenRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(citizenLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andReturn();

        JsonNode citizenJson = objectMapper.readTree(citizenRes.getResponse().getContentAsString());
        citizenToken = citizenJson.get("token").asText();

        // Admin login (provisioned admin)
        LoginRequest adminLogin = new LoginRequest("admin@civiclens.gov", "Admin@12345");
        MvcResult adminRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminRes.getResponse().getContentAsString());
        adminToken = adminJson.get("token").asText();

        // Invalid credentials rejection (401 Unauthorized)
        LoginRequest invalidLogin = new LoginRequest("jane.citizen@example.com", "WrongPassword!");
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    void testCitizenComplaintSubmission() throws Exception {
        Report report = new Report();
        report.setTitle("Broken Water Pipe");
        report.setDescription("Water flooding the sidewalk near Main Market");
        report.setCategory("Water Supply");
        report.setLatitude(12.9716);
        report.setLongitude(77.5946);
        report.setAddress("Main Market 4th Cross");

        MvcResult result = mockMvc.perform(post("/reports")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(report)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.user.email").value("jane.citizen@example.com"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        createdReportId = json.get("id").asLong();

        // Verify report status history was recorded
        mockMvc.perform(get("/reports/" + createdReportId + "/history")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].newStatus").value("PENDING"));
    }

    @Test
    @Order(5)
    void testOwnershipAndAuthorizationControls() throws Exception {
        // Another citizen logs in (user amit@gmail.com from existing records)
        // Login as admin to verify admin can view the created report
        mockMvc.perform(get("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Broken Water Pipe"));

        // Register a second citizen
        RegisterRequest otherCitizen = new RegisterRequest("Other Citizen", "other.citizen@example.com", "Password@123", null);
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherCitizen)))
                .andExpect(status().isCreated());

        LoginRequest otherLogin = new LoginRequest("other.citizen@example.com", "Password@123");
        MvcResult otherRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherLogin)))
                .andReturn();
        String otherToken = objectMapper.readTree(otherRes.getResponse().getContentAsString()).get("token").asText();

        // Other citizen cannot view Jane's report -> 403 Forbidden
        mockMvc.perform(get("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        // Other citizen cannot delete Jane's report -> 403 Forbidden
        mockMvc.perform(delete("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(6)
    void testAdminProvisionStaffAndAssignDepartment() throws Exception {
        // Admin creates a municipal staff member
        CreateStaffRequest staffReq = new CreateStaffRequest();
        staffReq.setName("Staff Officer Ramesh");
        staffReq.setEmail("ramesh.staff@civiclens.gov");
        staffReq.setPassword("StaffPass@123");
        staffReq.setDepartmentId(seededDepartmentId);
        staffReq.setPhone("9123456780");

        mockMvc.perform(post("/auth/create-staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("MUNICIPAL_STAFF"))
                .andExpect(jsonPath("$.department.id").value(seededDepartmentId));

        // Login as staff
        LoginRequest staffLogin = new LoginRequest("ramesh.staff@civiclens.gov", "StaffPass@123");
        MvcResult staffRes = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffLogin)))
                .andExpect(status().isOk())
                .andReturn();
        staffToken = objectMapper.readTree(staffRes.getResponse().getContentAsString()).get("token").asText();

        // Admin assigns the report to this department and staff
        User staffUser = userRepository.findByEmail("ramesh.staff@civiclens.gov").orElseThrow();
        AssignReportRequest assignReq = new AssignReportRequest(seededDepartmentId, staffUser.getId(), "Assigned to Water Works team");

        mockMvc.perform(put("/reports/" + createdReportId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.department.id").value(seededDepartmentId))
                .andExpect(jsonPath("$.assignedStaff.id").value(staffUser.getId()));
    }

    @Test
    @Order(7)
    void testStaffQueueAndStatusProgression() throws Exception {
        // Staff views assigned queue
        mockMvc.perform(get("/reports/staff")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Staff updates status to IN_PROGRESS
        StatusUpdateRequest inProgReq = new StatusUpdateRequest("IN_PROGRESS", "Inspection initiated on site");
        mockMvc.perform(put("/reports/" + createdReportId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inProgReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Citizen attempts deletion while IN_PROGRESS -> must be REJECTED (400 Bad Request)
        mockMvc.perform(delete("/reports/" + createdReportId)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("only be deleted while in PENDING status")));

        // Staff resolves report
        StatusUpdateRequest resolveReq = new StatusUpdateRequest("RESOLVED", "Pipe replaced and road restored");
        mockMvc.perform(put("/reports/" + createdReportId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());
    }

    @Test
    @Order(8)
    void testCitizenPendingDeletionFlow() throws Exception {
        // Create another report that remains PENDING
        Report pendingReport = new Report();
        pendingReport.setTitle("Temporary Pothole");
        pendingReport.setDescription("Small pothole to be removed");
        pendingReport.setCategory("Roads");

        MvcResult res = mockMvc.perform(post("/reports")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pendingReport)))
                .andExpect(status().isCreated())
                .andReturn();

        Long tempId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // Citizen deletes their own PENDING report -> should succeed with 200 OK
        mockMvc.perform(delete("/reports/" + tempId)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Confirm deleted from repository
        assertFalse(reportRepository.existsById(tempId));
    }
}
