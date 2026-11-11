package com.civiclens.civiclens.dto;

public class FileUploadResponse {

    private boolean success;
    private String imageUrl;
    private String message;
    private String fileName;
    private long fileSize;
    private String contentType;

    public FileUploadResponse() {
    }

    public FileUploadResponse(boolean success, String imageUrl, String message) {
        this.success = success;
        this.imageUrl = imageUrl;
        this.message = message;
    }

    public FileUploadResponse(boolean success, String imageUrl, String message, String fileName, long fileSize, String contentType) {
        this.success = success;
        this.imageUrl = imageUrl;
        this.message = message;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
    }

    public static FileUploadResponse success(String imageUrl, String fileName, long fileSize, String contentType) {
        return new FileUploadResponse(true, imageUrl, "Image uploaded successfully", fileName, fileSize, contentType);
    }

    public static FileUploadResponse success(String imageUrl) {
        return new FileUploadResponse(true, imageUrl, "Image uploaded successfully");
    }

    public static FileUploadResponse failure(String message) {
        return new FileUploadResponse(false, null, message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
