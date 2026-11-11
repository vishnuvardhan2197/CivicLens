package com.civiclens.civiclens.controller;

import com.civiclens.civiclens.dto.ApiResponse;
import com.civiclens.civiclens.model.Notification;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.UserRepository;
import com.civiclens.civiclens.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Notification updated = notificationService.markAsRead(id, user);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteNotification(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        notificationService.deleteNotification(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted successfully"));
    }
}
