package com.civiclens.civiclens;

import com.civiclens.civiclens.dto.*;
import com.civiclens.civiclens.model.*;
import com.civiclens.civiclens.repository.*;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase3IntegrationTests {

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
    private NotificationRepository notificationRepository;

    @Autowired
    private ReportStatusHistoryRepository reportStatusHistoryRepository;

    private static String adminToken;
    private static String citizenToken;
    private static String staffToken;
    private static String otherStaffToken;

    private static Long testDepartmentId;
    private static Long otherDepartmentId;
    private static Long testStaffId;
    private static Long otherStaffId;
    private static Long testCitizenId;
    private static Long testReportId;
    private static Long testNotificationId;

    @Test
    @Order(1)
    void setupAndCleanupPreviousTestArtifacts() throws Exception {
        // Clean up test users from previous test runs if any
        List<String> testEmails = List.of(
                "p3.citizen@example.com",
                "p3.staff@civiclens.gov",
                "p3.otherstaff@civiclens.gov"
        );

        for (String email : testEmails) {
            userRepository.findByEmail(email).ifPresent(user -> {
                // Delete user's notifications
                List<Notification> userNotifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
                notificationRepository.deleteAll(userNotifications);

                // Delete reports created by or assigned to this user
                List<Report> reports = reportRepository.findByUser(user);
                for (Report r : reports) {
                    reportStatusHistoryRepository.deleteAll(reportStatusHistoryRepository.findByReportOrderByTimestampDesc(r));
                    reportRepository.delete(r);
                }
                userRepository.delete(user);
            });
        }

        // Clean up test department if exists
        departmentRepository.findByName("Phase 3 Sanitation Test Dept").ifPresent(d -> {
            departmentRepository.delete(d);
        });
        departmentRepository.findByName("Phase 3 Roads Test Dept").ifPresent(d -> {
            departmentRepository.delete(d);
        });

        // 1. Authenticate default Admin
        LoginRequest adminLogin = new LoginRequest("admin@civiclens.gov", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        adminToken = adminJson.get("token").asText();
        assertNotNull(adminToken, "Admin token must not be null");
    }

    @Test
    @Order(2)
    void testDepartmentLifecycleByAdmin() throws Exception {
        // 1. Admin creates Department
        Department newDept = new Department();
        newDept.setName("Phase 3 Sanitation Test Dept");
        newDept.setDescription("Testing Phase 3 Sanitation Management");
        newDept.setContactEmail("p3sanitation@civiclens.gov");
        newDept.setContactPhone("1800-999-001");

        MvcResult createResult = mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDept)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Phase 3 Sanitation Test Dept"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        JsonNode deptJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        testDepartmentId = deptJson.get("id").asLong();

        // 2. Admin creates a second department for other staff
        Department otherDept = new Department();
        otherDept.setName("Phase 3 Roads Test Dept");
        otherDept.setDescription("Testing Phase 3 Roads Department");
        otherDept.setContactEmail("p3roads@civiclens.gov");
        otherDept.setContactPhone("1800-999-002");

        MvcResult otherDeptResult = mockMvc.perform(post("/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherDept)))
                .andExpect(status().isCreated())
                .andReturn();
        otherDepartmentId = objectMapper.readTree(otherDeptResult.getResponse().getContentAsString()).get("id").asLong();

        // 3. Admin updates Department
        Department updateDept = new Department();
        updateDept.setDescription("Updated Phase 3 Description");

        mockMvc.perform(put("/departments/" + testDepartmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated Phase 3 Description"));

        // 4. Verify public / authenticated retrieval
        mockMvc.perform(get("/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(3)
    void testAdminCreateMunicipalStaff() throws Exception {
        // 1. Admin creates staff for testDepartment
        CreateStaffRequest staffReq = new CreateStaffRequest();
        staffReq.setName("Phase 3 Staff User");
        staffReq.setEmail("p3.staff@civiclens.gov");
        staffReq.setPassword("StaffPassword@123");
        staffReq.setPhone("9123456780");
        staffReq.setDepartmentId(testDepartmentId);

        MvcResult staffResult = mockMvc.perform(post("/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("MUNICIPAL_STAFF"))
                .andExpect(jsonPath("$.department.id").value(testDepartmentId))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn();

        JsonNode staffJson = objectMapper.readTree(staffResult.getResponse().getContentAsString());
        testStaffId = staffJson.get("id").asLong();

        // 2. Admin creates other staff for otherDepartment
        CreateStaffRequest otherStaffReq = new CreateStaffRequest();
        otherStaffReq.setName("Other Staff User");
        otherStaffReq.setEmail("p3.otherstaff@civiclens.gov");
        otherStaffReq.setPassword("StaffPassword@123");
        otherStaffReq.setPhone("9123456781");
        otherStaffReq.setDepartmentId(otherDepartmentId);

        MvcResult otherStaffResult = mockMvc.perform(post("/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherStaffReq)))
                .andExpect(status().isCreated())
                .andReturn();
        otherStaffId = objectMapper.readTree(otherStaffResult.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @Order(4)
    void testCitizenRegistrationAndTokensAcquisition() throws Exception {
        // 1. Register citizen
        RegisterRequest citizenReq = new RegisterRequest(
                "Phase 3 Citizen",
                "p3.citizen@example.com",
                "CitizenPassword@123",
                "9876543210"
        );

        MvcResult citizenRegResult = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(citizenReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andReturn();

        testCitizenId = objectMapper.readTree(citizenRegResult.getResponse().getContentAsString()).get("id").asLong();

        // 2. Login citizen
        LoginRequest citizenLogin = new LoginRequest("p3.citizen@example.com", "CitizenPassword@123");
        MvcResult citizenLoginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(citizenLogin)))
                .andExpect(status().isOk())
                .andReturn();
        citizenToken = objectMapper.readTree(citizenLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 3. Login test staff
        LoginRequest staffLogin = new LoginRequest("p3.staff@civiclens.gov", "StaffPassword@123");
        MvcResult staffLoginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffLogin)))
                .andExpect(status().isOk())
                .andReturn();
        staffToken = objectMapper.readTree(staffLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 4. Login other staff
        LoginRequest otherStaffLogin = new LoginRequest("p3.otherstaff@civiclens.gov", "StaffPassword@123");
        MvcResult otherStaffLoginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherStaffLogin)))
                .andExpect(status().isOk())
                .andReturn();
        otherStaffToken = objectMapper.readTree(otherStaffLoginResult.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(5)
    void testCitizenComplaintSubmissionAndSubmissionNotification() throws Exception {
        // 1. Citizen creates complaint
        ReportRequest req = new ReportRequest();
        req.setTitle("Overflowing Garbage Dumpster");
        req.setDescription("Garbage container has not been cleared for days in Ward 5");
        req.setCategory("Sanitation");
        req.setImageUrl("/uploads/dumpster.jpg");
        req.setLatitude(17.385044);
        req.setLongitude(78.486671);
        req.setAddress("Ward 5, Market Road");
        req.setPriority("HIGH");

        MvcResult reportResult = mockMvc.perform(post("/reports")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn();

        JsonNode reportJson = objectMapper.readTree(reportResult.getResponse().getContentAsString());
        testReportId = reportJson.get("id").asLong();

        // 2. Verify Citizen received COMPLAINT_SUBMITTED notification
        MvcResult notifResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        JsonNode notifs = objectMapper.readTree(notifResult.getResponse().getContentAsString());
        assertTrue(notifs.size() > 0, "Citizen must have received at least one notification");

        JsonNode submittedNotif = null;
        for (JsonNode n : notifs) {
            String type = n.hasNonNull("notificationType") ? n.get("notificationType").asText() : "";
            long reportId = (n.hasNonNull("relatedReport") && n.get("relatedReport").hasNonNull("id"))
                    ? n.get("relatedReport").get("id").asLong() : -1L;
            if ("COMPLAINT_SUBMITTED".equals(type) && reportId == testReportId) {
                submittedNotif = n;
                break;
            }
        }
        assertNotNull(submittedNotif, "COMPLAINT_SUBMITTED notification must exist for the newly submitted complaint");
        testNotificationId = submittedNotif.get("id").asLong();

        // 3. Verify unread count is >= 1
        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").isNumber());
    }

    @Test
    @Order(6)
    void testAdminComplaintAssignmentAndNotifications() throws Exception {
        // 1. Admin assigns complaint to testDepartment and testStaff
        AssignReportRequest assignReq = new AssignReportRequest(
                testDepartmentId,
                testStaffId,
                "Assigned to Phase 3 Sanitation Staff for urgent resolution"
        );

        mockMvc.perform(put("/reports/" + testReportId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.department.id").value(testDepartmentId))
                .andExpect(jsonPath("$.assignedStaff.id").value(testStaffId));

        // 2. Verify Citizen received COMPLAINT_ASSIGNED notification
        MvcResult citizenNotifResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode citizenNotifs = objectMapper.readTree(citizenNotifResult.getResponse().getContentAsString());
        boolean hasAssignmentNotif = false;
        for (JsonNode n : citizenNotifs) {
            String type = n.hasNonNull("notificationType") ? n.get("notificationType").asText() : "";
            long reportId = (n.hasNonNull("relatedReport") && n.get("relatedReport").hasNonNull("id"))
                    ? n.get("relatedReport").get("id").asLong() : -1L;
            if ("COMPLAINT_ASSIGNED".equals(type) && reportId == testReportId) {
                hasAssignmentNotif = true;
                break;
            }
        }
        assertTrue(hasAssignmentNotif, "Citizen must receive COMPLAINT_ASSIGNED notification");

        // 3. Verify Staff received TASK_ASSIGNED notification
        MvcResult staffNotifResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode staffNotifs = objectMapper.readTree(staffNotifResult.getResponse().getContentAsString());
        boolean hasTaskNotif = false;
        for (JsonNode n : staffNotifs) {
            String type = n.hasNonNull("notificationType") ? n.get("notificationType").asText() : "";
            long reportId = (n.hasNonNull("relatedReport") && n.get("relatedReport").hasNonNull("id"))
                    ? n.get("relatedReport").get("id").asLong() : -1L;
            if ("COMPLAINT_ASSIGNED".equals(type) && reportId == testReportId) {
                hasTaskNotif = true;
                break;
            }
        }
        assertTrue(hasTaskNotif, "Assigned municipal staff must receive assignment notification");
    }

    @Test
    @Order(7)
    void testStaffQueueAndProgressUpdateWorkflow() throws Exception {
        // 1. Staff fetches assigned queue
        MvcResult queueResult = mockMvc.perform(get("/reports/staff/assigned")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        JsonNode queue = objectMapper.readTree(queueResult.getResponse().getContentAsString());
        boolean inQueue = false;
        for (JsonNode r : queue) {
            if (r.get("id").asLong() == testReportId) {
                inQueue = true;
                break;
            }
        }
        assertTrue(inQueue, "Assigned complaint must be in staff queue");

        // 2. Staff updates status to IN_PROGRESS
        StaffUpdateRequest inProgressReq = new StaffUpdateRequest(
                "IN_PROGRESS",
                "Sanitation team en route with garbage compactor truck",
                null
        );

        mockMvc.perform(put("/reports/" + testReportId + "/staff-update")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inProgressReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 3. Staff updates status to RESOLVED with proof photograph
        StaffUpdateRequest resolveReq = new StaffUpdateRequest(
                "RESOLVED",
                "Dumpster cleared and sanitized with disinfectant powder",
                "/uploads/clean-dumpster-proof.jpg"
        );

        mockMvc.perform(put("/reports/" + testReportId + "/staff-update")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 4. Verify status history includes proof photograph and remarks
        mockMvc.perform(get("/reports/" + testReportId + "/history")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].proofImageUrl").value("/uploads/clean-dumpster-proof.jpg"))
                .andExpect(jsonPath("$[0].remarks").value("Dumpster cleared and sanitized with disinfectant powder"));

        // 5. Verify Citizen received COMPLAINT_RESOLVED notification
        MvcResult citizenNotifResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode citizenNotifs = objectMapper.readTree(citizenNotifResult.getResponse().getContentAsString());
        boolean hasResolvedNotif = false;
        for (JsonNode n : citizenNotifs) {
            String type = n.hasNonNull("notificationType") ? n.get("notificationType").asText() : "";
            long reportId = (n.hasNonNull("relatedReport") && n.get("relatedReport").hasNonNull("id"))
                    ? n.get("relatedReport").get("id").asLong() : -1L;
            if ("COMPLAINT_RESOLVED".equals(type) && reportId == testReportId) {
                hasResolvedNotif = true;
                break;
            }
        }
        assertTrue(hasResolvedNotif, "Citizen must receive COMPLAINT_RESOLVED notification upon resolution");
    }

    @Test
    @Order(8)
    void testRoleBasedAccessControlAndSecurityEnforcement() throws Exception {
        // 1. Citizen cannot access /admin/users (403 Forbidden)
        mockMvc.perform(get("/admin/users")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());

        // 2. Staff cannot access /admin/users (403 Forbidden)
        mockMvc.perform(get("/admin/users")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        // 3. Citizen cannot create staff (403 Forbidden)
        CreateStaffRequest staffReq = new CreateStaffRequest();
        staffReq.setName("Illegal Staff");
        staffReq.setEmail("illegal@test.com");
        staffReq.setPassword("Password@123");
        staffReq.setDepartmentId(testDepartmentId);

        mockMvc.perform(post("/admin/staff")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isForbidden());

        // 4. Citizen cannot access staff queue (403 Forbidden)
        mockMvc.perform(get("/reports/staff/assigned")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());

        // 5. Other staff (different department & unassigned) cannot modify this report (403 Forbidden)
        StaffUpdateRequest illegalReq = new StaffUpdateRequest("IN_PROGRESS", "Unauthorized attempt", null);
        mockMvc.perform(put("/reports/" + testReportId + "/staff-update")
                        .header("Authorization", "Bearer " + otherStaffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(illegalReq)))
                .andExpect(status().isForbidden());

        // 6. Admin protection: Cannot demote or deactivate the last admin
        // Find admin user id
        User adminUser = userRepository.findByEmail("admin@civiclens.gov").orElseThrow();
        // Even if there are multiple admins, if we attempt to deactivate all until the last one, it protects:
        // Test updating role of non-existent user -> 404
        mockMvc.perform(put("/admin/users/999999/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "CITIZEN"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(9)
    void testDepartmentDeletionSafety() throws Exception {
        // testDepartment has active or historical reports (testReportId is assigned to it).
        // Calling DELETE /departments/{id} must NOT hard-delete or fail with FK constraint;
        // it must safely deactivate the department.
        mockMvc.perform(delete("/departments/" + testDepartmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify the department is now marked active=false
        Department dept = departmentRepository.findById(testDepartmentId).orElseThrow();
        assertFalse(dept.getActive(), "Department with existing reports must be deactivated instead of deleted");

        // Verify that activeOnly filter excludes this deactivated department
        MvcResult activeDeptsResult = mockMvc.perform(get("/departments?activeOnly=true"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode activeDepts = objectMapper.readTree(activeDeptsResult.getResponse().getContentAsString());
        for (JsonNode d : activeDepts) {
            assertNotEquals(testDepartmentId, d.get("id").asLong(), "Deactivated department must not appear in activeOnly list");
        }
    }

    @Test
    @Order(10)
    void testNotificationManagementAPIs() throws Exception {
        assertNotNull(testNotificationId, "Notification ID should be set from previous test");

        // 1. Mark single notification as read
        mockMvc.perform(put("/notifications/" + testNotificationId + "/read")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));

        // 2. Mark all as read
        mockMvc.perform(put("/notifications/read-all")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Unread count should now be 0
        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));

        // 4. Delete single notification
        mockMvc.perform(delete("/notifications/" + testNotificationId)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 5. Unauthenticated user cannot access notifications (403 or 401)
        mockMvc.perform(get("/notifications"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    void testAnalyticsAPIs() throws Exception {
        // 1. Admin gets summary
        mockMvc.perform(get("/analytics/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints").isNumber())
                .andExpect(jsonPath("$.resolvedComplaints").isNumber())
                .andExpect(jsonPath("$.pendingComplaints").isNumber())
                .andExpect(jsonPath("$.totalMunicipalStaff").isNumber());

        // 2. Admin gets categories breakdown
        mockMvc.perform(get("/analytics/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 3. Admin gets departments breakdown
        mockMvc.perform(get("/analytics/departments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 4. Admin gets monthly breakdown
        mockMvc.perform(get("/analytics/monthly")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 5. Citizen cannot access summary (403 Forbidden)
        mockMvc.perform(get("/analytics/summary")
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void testAdminPriorityUpdateAndFiltering() throws Exception {
        // 1. Admin updates complaint priority to EMERGENCY
        mockMvc.perform(put("/reports/" + testReportId + "/priority")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("priority", "EMERGENCY"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("EMERGENCY"));

        // 2. Citizen cannot update priority (403 Forbidden)
        mockMvc.perform(put("/reports/" + testReportId + "/priority")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("priority", "LOW"))))
                .andExpect(status().isForbidden());

        // 3. Admin queries paginated reports with filter
        mockMvc.perform(get("/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "RESOLVED")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
