package com.manaKhata.goal;

import com.manaKhata.auth.User;
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
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final SavingsGoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsGoal>>> getGoals(
            @AuthenticationPrincipal User currentUser) {
        List<SavingsGoal> goals = goalRepository.findByHouseholdIdOrderByTargetDateAsc(
                currentUser.getHousehold().getId());
        return ResponseEntity.ok(ApiResponse.success(goals));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavingsGoal>> createGoal(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String name = (String) body.get("name");
        String desc = (String) body.get("description");
        Double target = Double.valueOf(body.get("targetAmount").toString());
        String targetDateStr = (String) body.get("targetDate");
        LocalDate targetDate = targetDateStr != null ? LocalDate.parse(targetDateStr) : null;

        SavingsGoal goal = SavingsGoal.builder()
                .name(name)
                .description(desc)
                .targetAmount(target)
                .currentAmount(0.0)
                .targetDate(targetDate)
                .household(currentUser.getHousehold())
                .createdBy(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(goalRepository.save(goal)));
    }

    @PostMapping("/{goalId}/contribute")
    public ResponseEntity<ApiResponse<GoalContribution>> addContribution(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long goalId,
            @RequestBody Map<String, Object> body) {
        
        Double amount = Double.valueOf(body.get("amount").toString());
        String note = (String) body.get("note");

        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        GoalContribution contribution = GoalContribution.builder()
                .goal(goal)
                .contributor(currentUser)
                .amount(amount)
                .contributionDate(LocalDate.now())
                .note(note)
                .build();

        contribution = contributionRepository.save(contribution);

        // Update goal total
        goal.setCurrentAmount(goal.getCurrentAmount() + amount);
        goalRepository.save(goal);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(contribution));
    }
}
