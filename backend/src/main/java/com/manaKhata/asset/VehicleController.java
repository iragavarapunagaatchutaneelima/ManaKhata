package com.manaKhata.asset;

import com.manaKhata.auth.User;
import com.manaKhata.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final VehicleExpenseRepository vehicleExpenseRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Vehicle>>> getVehicles(@AuthenticationPrincipal User currentUser) {
        List<Vehicle> vehicles = vehicleRepository.findByHouseholdId(currentUser.getHousehold().getId());
        return ResponseEntity.ok(ApiResponse.success(vehicles));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVehicleDetail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<VehicleExpense> expenses = vehicleExpenseRepository.findByVehicleId(id);
        Double totalFuel = vehicleExpenseRepository.sumFuelByVehicle(id);
        Double totalMaintenance = vehicleExpenseRepository.sumMaintenanceByVehicle(id);
        List<Object[]> contributions = vehicleExpenseRepository.getContributionBreakdown(id);

        Map<String, Object> data = new HashMap<>();
        data.put("vehicle", vehicle);
        data.put("expenses", expenses);
        data.put("totalFuelCost", totalFuel != null ? totalFuel : 0.0);
        data.put("totalMaintenanceCost", totalMaintenance != null ? totalMaintenance : 0.0);
        data.put("contributionBreakdown", contributions);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Vehicle>> addVehicle(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody VehicleRequest request
    ) {
        Vehicle vehicle = Vehicle.builder()
                .owner(currentUser)
                .household(currentUser.getHousehold())
                .name(request.getName())
                .registrationNumber(request.getRegistrationNumber())
                .vehicleType(request.getVehicleType())
                .make(request.getMake())
                .model(request.getModel())
                .year(request.getYear())
                .fuelType(request.getFuelType())
                .mileageKmpl(request.getMileageKmpl())
                .insuranceExpiry(request.getInsuranceExpiry())
                .pucExpiry(request.getPucExpiry())
                .isShared(request.getIsShared() != null ? request.getIsShared() : false)
                .notes(request.getNotes())
                .isActive(true)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(vehicleRepository.save(vehicle), "Vehicle added"));
    }

    @PostMapping("/{id}/expenses")
    public ResponseEntity<ApiResponse<VehicleExpense>> addVehicleExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody VehicleExpenseRequest request
    ) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        VehicleExpense expense = VehicleExpense.builder()
                .vehicle(vehicle)
                .contributor(currentUser)
                .household(currentUser.getHousehold())
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseType(request.getExpenseType())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .fuelLiters(request.getFuelLiters())
                .odometerReading(request.getOdometerReading())
                .notes(request.getNotes())
                .build();

        // Update vehicle totals
        if (request.getExpenseType() == VehicleExpenseType.FUEL) {
            vehicle.setTotalFuelCost(vehicle.getTotalFuelCost() + request.getAmount());
        } else {
            vehicle.setTotalMaintenanceCost(vehicle.getTotalMaintenanceCost() + request.getAmount());
        }
        vehicleRepository.save(vehicle);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(vehicleExpenseRepository.save(expense), "Expense logged"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getOwner().getId().equals(currentUser.getId()) && !currentUser.getIsHousehead()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
        }

        vehicle.setIsActive(false);
        vehicleRepository.save(vehicle);
        return ResponseEntity.ok(ApiResponse.success(null, "Vehicle removed"));
    }
}
