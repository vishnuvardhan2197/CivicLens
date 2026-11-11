package com.civiclens.civiclens.service;

import com.civiclens.civiclens.exception.ResourceNotFoundException;
import com.civiclens.civiclens.exception.UnauthorizedActionException;
import com.civiclens.civiclens.model.Notification;
import com.civiclens.civiclens.model.NotificationType;
import com.civiclens.civiclens.model.Report;
import com.civiclens.civiclens.model.User;
import com.civiclens.civiclens.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification sendNotification(User recipient, String title, String message, NotificationType type, Report report) {
        if (recipient == null) {
            log.warn("Cannot send notification: recipient is null. Title: {}", title);
            return null;
        }

        Notification notification = new Notification(recipient, title, message, type, report);
        Notification saved = notificationRepository.save(notification);
        log.info("Notification sent to {}: {} (Type: {})", recipient.getEmail(), title, type);
        return saved;
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public Notification markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new UnauthorizedActionException("You can only access your own notifications");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user);
    }

    @Transactional
    public void deleteNotification(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new UnauthorizedActionException("You can only delete your own notifications");
        }

        notificationRepository.delete(notification);
    }
}
