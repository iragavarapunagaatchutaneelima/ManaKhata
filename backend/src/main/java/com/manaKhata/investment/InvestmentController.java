package com.manaKhata.investment;

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
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentAssetRepository investmentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvestmentAsset>>> getInvestments(
            @AuthenticationPrincipal User currentUser) {
        
        List<InvestmentAsset> investments;
        if (currentUser.getIsHousehead() || currentUser.getRole().name().equals("PARENT")) {
            investments = investmentRepository.findByHouseholdIdOrderByInvestmentDateDesc(currentUser.getHousehold().getId());
        } else {
            investments = investmentRepository.findByOwnerIdOrderByInvestmentDateDesc(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(investments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvestmentAsset>> createInvestment(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String name = (String) body.get("name");
        InvestmentAssetType type = InvestmentAssetType.valueOf((String) body.get("assetType"));
        Double investedAmount = Double.valueOf(body.get("investedAmount").toString());
        
        Object cv = body.get("currentValue");
        Double currentValue = cv != null ? Double.valueOf(cv.toString()) : investedAmount;
        
        String dateStr = (String) body.get("investmentDate");
        LocalDate investmentDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        
        String platform = (String) body.get("platformOrBroker");

        InvestmentAsset asset = InvestmentAsset.builder()
                .name(name)
                .assetType(type)
                .investedAmount(investedAmount)
                .currentValue(currentValue)
                .investmentDate(investmentDate)
                .platformOrBroker(platform)
                .household(currentUser.getHousehold())
                .owner(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(investmentRepository.save(asset)));
    }
}
