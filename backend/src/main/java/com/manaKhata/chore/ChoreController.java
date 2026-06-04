package com.manaKhata.chore;

import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chores")
@RequiredArgsConstructor
public class ChoreController {

    private final ChoreRepository choreRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Chore>>> getChores(
            @AuthenticationPrincipal User currentUser) {
        
        List<Chore> chores;
        if (currentUser.getIsHousehead() || currentUser.getRole().name().equals("PARENT")) {
            chores = choreRepository.findByHouseholdIdOrderByDueDateAsc(currentUser.getHousehold().getId());
        } else {
            chores = choreRepository.findByAssignedToIdOrderByDueDateAsc(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(chores));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Chore>> createChore(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String title = (String) body.get("title");
        String desc = (String) body.get("description");
        Double reward = Double.valueOf(body.get("rewardAmount").toString());
        String dueDateStr = (String) body.get("dueDate");
        LocalDate dueDate = dueDateStr != null ? LocalDate.parse(dueDateStr) : null;
        Long assignedToId = Long.valueOf(body.get("assignedToId").toString());

        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        Chore chore = Chore.builder()
                .title(title)
                .description(desc)
                .rewardAmount(reward)
                .status(ChoreStatus.PENDING)
                .dueDate(dueDate)
                .household(currentUser.getHousehold())
                .assignedBy(currentUser)
                .assignedTo(assignedTo)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(choreRepository.save(chore)));
    }

    @PatchMapping("/{choreId}/status")
    public ResponseEntity<ApiResponse<Chore>> updateStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long choreId,
            @RequestBody Map<String, String> body) {
        
        ChoreStatus newStatus = ChoreStatus.valueOf(body.get("status"));
        Chore chore = choreRepository.findById(choreId)
                .orElseThrow(() -> new RuntimeException("Chore not found"));

        // If approved, transfer wallet balance from househead to child (simulated here)
        if (newStatus == ChoreStatus.APPROVED && chore.getStatus() != ChoreStatus.APPROVED) {
            User child = chore.getAssignedTo();
            child.setWalletBalance(child.getWalletBalance() + chore.getRewardAmount());
            userRepository.save(child);
        }

        chore.setStatus(newStatus);
        return ResponseEntity.ok(ApiResponse.success(choreRepository.save(chore)));
    }
}
