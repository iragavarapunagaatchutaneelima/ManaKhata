package com.manaKhata.medical;

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
@RequestMapping("/api/medical")
@RequiredArgsConstructor
public class MedicalController {

    private final InsurancePolicyRepository policyRepository;

    @GetMapping("/policies")
    public ResponseEntity<ApiResponse<List<InsurancePolicy>>> getPolicies(
            @AuthenticationPrincipal User currentUser) {
        
        List<InsurancePolicy> policies = policyRepository.findByHouseholdIdOrderByExpiryDateAsc(currentUser.getHousehold().getId());
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @PostMapping("/policies")
    public ResponseEntity<ApiResponse<InsurancePolicy>> createPolicy(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String provider = (String) body.get("provider");
        String policyNumber = (String) body.get("policyNumber");
        String policyType = (String) body.get("policyType");
        Double coverage = Double.valueOf(body.get("coverageAmount").toString());
        
        Object premium = body.get("premiumAmount");
        Double premiumAmount = premium != null ? Double.valueOf(premium.toString()) : 0.0;
        
        String expiryStr = (String) body.get("expiryDate");
        LocalDate expiryDate = expiryStr != null ? LocalDate.parse(expiryStr) : LocalDate.now().plusYears(1);

        InsurancePolicy policy = InsurancePolicy.builder()
                .provider(provider)
                .policyNumber(policyNumber)
                .policyType(policyType)
                .coverageAmount(coverage)
                .premiumAmount(premiumAmount)
                .expiryDate(expiryDate)
                .household(currentUser.getHousehold())
                .owner(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(policyRepository.save(policy)));
    }
}
