package com.manaKhata.trip;

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
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripRepository tripRepository;
    private final TripExpenseRepository tripExpenseRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Trip>>> getTrips(
            @AuthenticationPrincipal User currentUser) {
        
        List<Trip> trips = tripRepository.findByHouseholdIdOrderByStartDateDesc(currentUser.getHousehold().getId());
        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Trip>> createTrip(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> body) {
        
        String destination = (String) body.get("destination");
        Double budget = Double.valueOf(body.get("budget").toString());
        String baseCurrency = (String) body.get("baseCurrency");
        
        String startStr = (String) body.get("startDate");
        String endStr = (String) body.get("endDate");
        LocalDate startDate = startStr != null ? LocalDate.parse(startStr) : LocalDate.now();
        LocalDate endDate = endStr != null ? LocalDate.parse(endStr) : LocalDate.now().plusDays(7);

        Trip trip = Trip.builder()
                .destination(destination)
                .budget(budget)
                .baseCurrency(baseCurrency)
                .startDate(startDate)
                .endDate(endDate)
                .household(currentUser.getHousehold())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tripRepository.save(trip)));
    }

    @GetMapping("/{tripId}/expenses")
    public ResponseEntity<ApiResponse<List<TripExpense>>> getTripExpenses(
            @PathVariable Long tripId) {
        
        List<TripExpense> expenses = tripExpenseRepository.findByTripIdOrderByExpenseDateDesc(tripId);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @PostMapping("/{tripId}/expenses")
    public ResponseEntity<ApiResponse<TripExpense>> createTripExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long tripId,
            @RequestBody Map<String, Object> body) {
        
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        String description = (String) body.get("description");
        Double amount = Double.valueOf(body.get("amount").toString());
        String currencyCode = (String) body.get("currencyCode");
        Double exchangeRate = Double.valueOf(body.get("exchangeRate").toString());
        
        String dateStr = (String) body.get("expenseDate");
        LocalDate expenseDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        TripExpense expense = TripExpense.builder()
                .description(description)
                .amount(amount)
                .currencyCode(currencyCode)
                .exchangeRate(exchangeRate)
                .expenseDate(expenseDate)
                .trip(trip)
                .paidBy(currentUser)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tripExpenseRepository.save(expense)));
    }
}
