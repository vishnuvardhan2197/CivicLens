package com.civiclens.civiclens.service;

import com.civiclens.civiclens.dto.FileUploadResponse;
import com.civiclens.civiclens.exception.InvalidOperationException;
import com.civiclens.civiclens.exception.UnauthorizedActionException;
import com.civiclens.civiclens.model.Role;
import com.civiclens.civiclens.model.User;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger log = LoggerFactory.getLogger(FileUploadService.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/pjpeg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> ALLOWED_FOLDERS = Set.of("complaints", "progress");

    @Value("${civiclens.upload.dir:uploads}")
    private String uploadBaseDir;

    @Value("${civiclens.upload.max-size-bytes:5242880}")
    private long maxFileSizeBytes; // 5 MB

    @Value("${civiclens.upload.base-url:/uploads}")
    private String publicBaseUrl;

    private Path rootStorageLocation;

    @PostConstruct
    public void init() {
        this.rootStorageLocation = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootStorageLocation);
            Files.createDirectories(this.rootStorageLocation.resolve("complaints"));
            Files.createDirectories(this.rootStorageLocation.resolve("progress"));
            log.info("Media storage directory initialized at: {}", this.rootStorageLocation);
        } catch (IOException e) {
            log.error("Could not initialize media storage directories", e);
            throw new RuntimeException("Could not initialize media storage directories", e);
        }
    }

    public FileUploadResponse storeFile(MultipartFile file, String folder, User currentUser) {
        // 1. Validate file presence
        if (file == null || file.isEmpty()) {
            throw new InvalidOperationException("Uploaded file cannot be empty");
        }

        // 2. Validate file size
        if (file.getSize() > maxFileSizeBytes) {
            throw new InvalidOperationException("File size (" + (file.getSize() / 1024 / 1024) +
                    " MB) exceeds the maximum allowed limit of 5 MB");
        }

        // 3. Validate folder & role permission
        String targetFolder = (folder == null || folder.isBlank()) ? "complaints" : folder.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_FOLDERS.contains(targetFolder)) {
            throw new InvalidOperationException("Invalid upload folder. Must be 'complaints' or 'progress'");
        }

        if ("progress".equals(targetFolder) && currentUser.getRole() != Role.MUNICIPAL_STAFF && currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only municipal staff and administrators can upload progress photographs");
        }

        // 4. Validate filename & extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new InvalidOperationException("Uploaded file must have a valid extension (.jpg, .jpeg, .png, .webp)");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidOperationException("Unsupported file extension: ." + extension +
                    ". Only JPEG, JPG, PNG, and WebP images are permitted");
        }

        // 5. Validate Content-Type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidOperationException("Invalid Content-Type: " + contentType +
                    ". Only image/jpeg, image/png, and image/webp are allowed");
        }

        // 6. Deep inspection: Validate Magic Bytes / File Signature
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = new byte[12];
            int bytesRead = inputStream.read(header);
            if (bytesRead < 12 || !isValidImageSignature(header, extension)) {
                throw new InvalidOperationException("File signature does not match a valid " + extension.toUpperCase() +
                        " image. Executables and forged files are rejected.");
            }
        } catch (IOException e) {
            log.error("Error reading uploaded file bytes", e);
            throw new InvalidOperationException("Unable to read uploaded file: " + e.getMessage());
        }

        // 7. Generate safe unique filename
        String normalizedExt = "jpeg".equals(extension) ? "jpg" : extension;
        String uniqueFilename = UUID.randomUUID().toString() + "." + normalizedExt;

        // 8. Resolve destination path and verify directory traversal
        Path folderPath = this.rootStorageLocation.resolve(targetFolder).normalize();
        Path destinationFile = folderPath.resolve(uniqueFilename).normalize();

        if (!destinationFile.startsWith(this.rootStorageLocation)) {
            throw new InvalidOperationException("Path traversal attempt detected. Upload rejected.");
        }

        // 9. Write to disk
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store file {}", uniqueFilename, e);
            throw new RuntimeException("Failed to store uploaded file on server", e);
        }

        // 10. Construct accessible URL path
        String imageUrl = publicBaseUrl + "/" + targetFolder + "/" + uniqueFilename;
        log.info("User {} successfully uploaded image to {}", currentUser.getEmail(), imageUrl);

        return FileUploadResponse.success(imageUrl, uniqueFilename, file.getSize(), contentType);
    }

    private boolean isValidImageSignature(byte[] header, String extension) {
        if (header == null || header.length < 12) {
            return false;
        }

        // JPEG: FF D8 FF
        if ("jpg".equals(extension) || "jpeg".equals(extension)) {
            return (header[0] & 0xFF) == 0xFF &&
                   (header[1] & 0xFF) == 0xD8 &&
                   (header[2] & 0xFF) == 0xFF;
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ("png".equals(extension)) {
            return (header[0] & 0xFF) == 0x89 &&
                   (header[1] & 0xFF) == 0x50 &&
                   (header[2] & 0xFF) == 0x4E &&
                   (header[3] & 0xFF) == 0x47 &&
                   (header[4] & 0xFF) == 0x0D &&
                   (header[5] & 0xFF) == 0x0A &&
                   (header[6] & 0xFF) == 0x1A &&
                   (header[7] & 0xFF) == 0x0A;
        }

        // WebP: starts with 'RIFF' and bytes 8..11 are 'WEBP'
        if ("webp".equals(extension)) {
            boolean isRiff = header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F';
            boolean isWebp = header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            return isRiff && isWebp;
        }

        return false;
    }

    public Path getRootStorageLocation() {
        return rootStorageLocation;
    }
}
