package com.manaKhata.tax;

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
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxController {

    private final TaxDocumentRepository taxRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaxDocument>>> getTaxDocuments(
            @AuthenticationPrincipal User currentUser) {
        
        List<TaxDocument> docs = taxRepository.findByOwnerIdOrderByDateUploadedDesc(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaxDocument>> createDocument(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String name = (String) body.get("documentName");
        String category = (String) body.get("category");
        Double amount = Double.valueOf(body.get("amount").toString());
        String fy = (String) body.get("financialYear");
        
        TaxDocument doc = TaxDocument.builder()
                .documentName(name)
                .category(category)
                .amount(amount)
                .financialYear(fy)
                .dateUploaded(LocalDate.now())
                .household(currentUser.getHousehold())
                .owner(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taxRepository.save(doc)));
    }
}
