package com.manaKhata.reimbursement;

import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.common.ApiResponse;
import com.manaKhata.backup.DataChangedEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reimbursements")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReimbursementController {

    private final ReimbursementRepository reimbursementRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Reimbursement>>> getReimbursements(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String filter // "mine" or "household"
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Reimbursement> reimbursements;
        if ("mine".equals(filter)) {
            reimbursements = reimbursementRepository.findByPayerId(currentUser.getId(), pageable);
        } else {
            reimbursements = reimbursementRepository.findByHouseholdId(
                    currentUser.getHousehold().getId(), pageable
            );
        }

        return ResponseEntity.ok(ApiResponse.success(reimbursements));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Reimbursement>> createReimbursement(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ReimbursementRequest request
    ) {
        User reimbursee = null;
        if (request.getReimburseeId() != null) {
            reimbursee = userRepository.findById(request.getReimburseeId()).orElse(null);
        }

        Reimbursement reimb = Reimbursement.builder()
                .payer(currentUser)
                .reimbursee(reimbursee)
                .household(currentUser.getHousehold())
                .amount(request.getAmount())
                .description(request.getDescription())
                .category(request.getCategory())
                .paidDate(request.getPaidDate() != null ? request.getPaidDate() : LocalDate.now())
                .notes(request.getNotes())
                .isHouseholdExpense(request.getIsHouseholdExpense() != null ? request.getIsHouseholdExpense() : true)
                .status(ReimbursementStatus.PENDING)
                .build();

        Reimbursement saved = reimbursementRepository.save(reimb);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Reimbursement", "CREATED"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Reimbursement request created"));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Reimbursement>> approveReimbursement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can approve reimbursements"));
        }

        Reimbursement reimb = reimbursementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reimbursement not found"));

        reimb.setStatus(ReimbursementStatus.APPROVED);
        reimb.setApprovedBy(currentUser);

        Reimbursement updated = reimbursementRepository.save(reimb);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Reimbursement", "APPROVED"));
        return ResponseEntity.ok(ApiResponse.success(updated, "Approved"));
    }

    @PatchMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<Reimbursement>> settleReimbursement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can settle reimbursements"));
        }

        Reimbursement reimb = reimbursementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reimbursement not found"));

        reimb.setStatus(ReimbursementStatus.SETTLED);
        reimb.setSettledDate(LocalDate.now());

        Reimbursement updated = reimbursementRepository.save(reimb);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Reimbursement", "SETTLED"));
        return ResponseEntity.ok(ApiResponse.success(updated, "Settled"));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Reimbursement>> rejectReimbursement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        if (!currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only househead can reject reimbursements"));
        }

        Reimbursement reimb = reimbursementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reimbursement not found"));

        reimb.setStatus(ReimbursementStatus.REJECTED);

        Reimbursement updated = reimbursementRepository.save(reimb);
        eventPublisher.publishEvent(new DataChangedEvent(this, "Reimbursement", "REJECTED"));
        return ResponseEntity.ok(ApiResponse.success(updated, "Rejected"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @AuthenticationPrincipal User currentUser
    ) {
        Long householdId = currentUser.getHousehold().getId();

        Double pendingHousehold = reimbursementRepository.sumPendingByHousehold(householdId);
        Double pendingByMe = reimbursementRepository.sumPendingByUser(currentUser.getId());
        List<Reimbursement> pendingList = reimbursementRepository
                .findByHouseholdIdAndStatus(householdId, ReimbursementStatus.PENDING);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPendingHousehold", pendingHousehold != null ? pendingHousehold : 0.0);
        summary.put("totalPendingByMe", pendingByMe != null ? pendingByMe : 0.0);
        summary.put("pendingCount", pendingList.size());
        summary.put("pendingItems", pendingList);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
