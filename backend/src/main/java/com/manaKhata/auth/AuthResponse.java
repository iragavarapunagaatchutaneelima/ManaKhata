package com.manaKhata.auth;

import com.manaKhata.household.Household;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean isHousehead;
    private Long householdId;
    private String householdName;
    private String inviteCode;
    private Double walletBalance;
    private String avatarUrl;
    private String token;
    private String refreshToken;

    public static AuthResponse from(User user, String token, String refreshToken, Household household) {
        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isHousehead(user.getIsHousehead())
                .householdId(household != null ? household.getId() : null)
                .householdName(household != null ? household.getName() : null)
                .inviteCode(household != null ? household.getInviteCode() : null)
                .walletBalance(user.getWalletBalance())
                .avatarUrl(user.getAvatarUrl())
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }
}
