package com.manaKhata.asset;

import lombok.Data;

@Data
public class VehicleRequest {
    private String name;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String make;
    private String model;
    private Integer year;
    private String fuelType;
    private Double mileageKmpl;
    private String insuranceExpiry;
    private String pucExpiry;
    private Boolean isShared;
    private String notes;
}
