package com.manaKhata.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    private String phone;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String householdName;
    private String inviteCode;
    private UserRole role = UserRole.ADULT_CHILD;
    private Gender gender = Gender.PREFER_NOT_TO_SAY;
    private Double monthlyIncome;
}
