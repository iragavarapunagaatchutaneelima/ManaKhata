package com.manaKhata.household;

import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/household")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class HouseholdController {

    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyHousehold(
            @AuthenticationPrincipal User currentUser
    ) {
        Household household = resolveHousehold(currentUser);
        if (household == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No household found"));
        }

        List<User> members = userRepository.findByHouseholdId(household.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("household", household);
        data.put("members", members.stream().map(m -> Map.of(
            "id", m.getId(),
            "fullName", m.getFullName(),
            "email", m.getEmail(),
            "role", m.getRole().name(),
            "isHousehead", m.getIsHousehead(),
            "walletBalance", m.getWalletBalance(),
            "avatarUrl", m.getAvatarUrl() != null ? m.getAvatarUrl() : ""
        )).toList());
        data.put("totalMembers", members.size());
        data.put("inviteCode", household.getInviteCode());

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Household>> updateHousehold(
            @AuthenticationPrincipal User currentUser,
            @RequestBody HouseholdUpdateRequest request
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can update household"));
        }

        Household household = resolveHousehold(currentUser);
        if (household == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No household found"));
        }
        if (request.getName() != null) household.setName(request.getName());
        if (request.getDescription() != null) household.setDescription(request.getDescription());
        if (request.getAddress() != null) household.setAddress(request.getAddress());
        if (request.getCity() != null) household.setCity(request.getCity());
        if (request.getMonthlyIncome() != null) household.setMonthlyIncome(request.getMonthlyIncome());

        return ResponseEntity.ok(ApiResponse.success(householdRepository.save(household), "Household updated"));
    }

    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMembers(
            @AuthenticationPrincipal User currentUser
    ) {
        List<User> members = userRepository.findByHouseholdId(currentUser.getHousehold().getId());

        List<Map<String, Object>> memberList = members.stream().map(m -> {
            Map<String, Object> memberMap = new HashMap<>();
            memberMap.put("id", m.getId());
            memberMap.put("fullName", m.getFullName());
            memberMap.put("email", m.getEmail());
            memberMap.put("role", m.getRole().name());
            memberMap.put("isHousehead", m.getIsHousehead());
            memberMap.put("walletBalance", m.getWalletBalance());
            memberMap.put("monthlyIncome", m.getMonthlyIncome());
            memberMap.put("phone", m.getPhone());
            memberMap.put("gender", m.getGender() != null ? m.getGender().name() : null);
            return memberMap;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success(memberList));
    }

    @PatchMapping("/members/{memberId}/permissions")
    public ResponseEntity<ApiResponse<String>> updatePermissions(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long memberId,
            @RequestBody Map<String, Boolean> permissions
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can manage permissions"));
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (permissions.containsKey("canViewHousehold")) {
            member.setCanViewHousehold(permissions.get("canViewHousehold"));
        }
        if (permissions.containsKey("canViewAnalytics")) {
            member.setCanViewAnalytics(permissions.get("canViewAnalytics"));
        }
        if (permissions.containsKey("canManageExpenses")) {
            member.setCanManageExpenses(permissions.get("canManageExpenses"));
        }

        userRepository.save(member);
        return ResponseEntity.ok(ApiResponse.success("Permissions updated"));
    }

    @PostMapping("/wallet/allocate")
    public ResponseEntity<ApiResponse<String>> allocateWallet(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> request
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can allocate wallet"));
        }

        Long memberId = Long.valueOf(request.get("memberId").toString());
        Double amount = Double.valueOf(request.get("amount").toString());

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        member.setWalletBalance(member.getWalletBalance() + amount);
        userRepository.save(member);

        return ResponseEntity.ok(ApiResponse.success("₹" + amount + " allocated to " + member.getFullName()));
    }

    private Household resolveHousehold(User currentUser) {
        if (currentUser == null || currentUser.getHousehold() == null || currentUser.getHousehold().getId() == null) {
            return null;
        }

        return householdRepository.findById(currentUser.getHousehold().getId())
                .orElse(null);
    }
}
